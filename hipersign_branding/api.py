import frappe
import json


def _get_display_name(phone_number):
    """Resolve best display name: Contact > CRM Lead > CRM Deal > profile_name > number"""
    contact = frappe.db.get_value(
        "Contact Phone", {"phone": ["like", f"%{phone_number[-10:]}%"]}, "parent"
    )
    if contact:
        name = frappe.db.get_value("Contact", contact, "first_name")
        if name:
            return name, contact

    lead = frappe.db.get_value("CRM Lead", {"mobile_no": ["like", f"%{phone_number[-10:]}%"]}, ["name", "lead_name"])
    if lead:
        return lead[1] or lead[0], None

    deal = frappe.db.get_value("CRM Deal", {"mobile_no": ["like", f"%{phone_number[-10:]}%"]}, ["name", "organization"])
    if deal:
        return deal[1] or deal[0], None

    profile_name = frappe.db.get_value(
        "WhatsApp Message", {"from": phone_number}, "profile_name", order_by="creation desc"
    )
    return profile_name or phone_number, contact


@frappe.whitelist()
def get_conversations():
    rows = frappe.get_all(
        "WhatsApp Conversation",
        fields=["phone_number", "contact_name", "contact", "reference_doctype", "reference_name", "last_message", "last_message_time", "unread_count"],
        order_by="last_message_time desc"
    )
    for r in rows:
        r["customer_name"] = r.get("contact_name") or r.get("phone_number")
    return rows


@frappe.whitelist()
def get_messages(phone_number):
    return frappe.get_all(
        "WhatsApp Message",
        or_filters=[["from", "=", phone_number], ["to", "=", phone_number]],
        fields=["name", "type", "from", "to", "message", "content_type", "creation", "attach", "status", "message_type", "template"],
        order_by="creation asc",
        limit_page_length=200
    )


@frappe.whitelist()
def send_message(phone_number, text):
    doc = frappe.get_doc({
        "doctype": "WhatsApp Message",
        "type": "Outgoing",
        "to": phone_number,
        "message": text,
        "content_type": "text",
        "message_type": "Manual"
    })
    doc.insert(ignore_permissions=True)
    return doc.name


@frappe.whitelist()
def mark_read(phone_number):
    if frappe.db.exists("WhatsApp Conversation", phone_number):
        frappe.db.set_value("WhatsApp Conversation", phone_number, "unread_count", 0)
        frappe.db.commit()
    return True


@frappe.whitelist()
def get_templates():
    return frappe.get_all(
        "WhatsApp Templates",
        filters={"status": ["in", ["Approved", "Pending"]]},
        fields=["name", "template_name", "actual_name", "category", "header_type", "template", "field_names", "footer"]
    )


@frappe.whitelist()
def send_template(phone_number, template, params=None):
    if isinstance(params, str):
        params = json.loads(params)

    # frappe_whatsapp calls .values() on body_param — it must be a dict, not a list
    if isinstance(params, (list, tuple)):
        params = {str(i): v for i, v in enumerate(params, start=1)}
    elif not isinstance(params, dict):
        params = {}

    doc = frappe.get_doc({
        "doctype": "WhatsApp Message",
        "type": "Outgoing",
        "to": phone_number,
        "use_template": 1,
        "template": template,
        "body_param": json.dumps(params),
        "content_type": "text",
        "message_type": "Template",
    })
    doc.insert(ignore_permissions=True)
    return doc.name


@frappe.whitelist()
def rebuild_conversations():
    """One-time backfill: create/update WhatsApp Conversation for every existing WhatsApp Message"""
    messages = frappe.get_all(
        "WhatsApp Message",
        fields=["name", "from", "to", "type", "message", "creation", "reference_doctype", "reference_name", "whatsapp_account"],
        order_by="creation asc"
    )
    count = 0
    for m in messages:
        phone = m.get("from") if m.get("type") == "Incoming" else m.get("to")
        if not phone:
            continue

        display_name, contact = _get_display_name(phone)

        if not frappe.db.exists("WhatsApp Conversation", phone):
            conv = frappe.get_doc({
                "doctype": "WhatsApp Conversation",
                "phone_number": phone,
                "contact_name": display_name,
                "contact": contact,
                "whatsapp_account": m.get("whatsapp_account"),
                "reference_doctype": m.get("reference_doctype") if m.get("reference_doctype") != "Contact" else None,
                "reference_name": m.get("reference_name") if m.get("reference_doctype") != "Contact" else None,
            })
            conv.insert(ignore_permissions=True)
            count += 1
        else:
            conv = frappe.get_doc("WhatsApp Conversation", phone)
            if display_name and display_name != phone:
                conv.contact_name = display_name
            if contact:
                conv.contact = contact
            if m.get("reference_doctype") and m.get("reference_doctype") != "Contact":
                conv.reference_doctype = m.get("reference_doctype")
                conv.reference_name = m.get("reference_name")

        conv.last_message = (m.get("message") or "")[:140]
        conv.last_message_time = m.get("creation")
        conv.save(ignore_permissions=True)

    frappe.db.commit()
    return {"processed": len(messages), "conversations_touched": count}

def _guess_content_type(file_url):
    ext = (file_url or "").lower().rsplit(".", 1)[-1] if "." in (file_url or "") else ""
    if ext in ("jpg", "jpeg", "png", "webp"):
        return "image"
    if ext in ("mp4", "mov", "3gp"):
        return "video"
    if ext in ("mp3", "ogg", "wav", "aac", "amr"):
        return "audio"
    return "document"


@frappe.whitelist()
def send_attachment(phone_number, file_url, file_name=None):
    content_type = _guess_content_type(file_url)
    doc = frappe.get_doc({
        "doctype": "WhatsApp Message",
        "type": "Outgoing",
        "to": phone_number,
        "attach": file_url,
        "content_type": content_type,
        "message": file_name or "",
        "message_type": "Manual"
    })
    doc.insert(ignore_permissions=True)
    return doc.name


@frappe.whitelist()
def search_contacts(query):
	if not query:
		return []
	return frappe.db.sql("""
		select c.name as contact, c.first_name as customer_name, cp.phone as phone_number
		from `tabContact` c
		inner join `tabContact Phone` cp on cp.parent = c.name
		where c.first_name like %(q)s or cp.phone like %(q)s
		order by c.first_name
		limit 25
	""", {"q": f"%{query}%"}, as_dict=True)
