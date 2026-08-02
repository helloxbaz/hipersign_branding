import frappe
from hipersign_branding.api import _get_display_name


def _notify_agents(doc, display_name, phone, contact, ref_doctype, ref_name):
    recipients = set()

    for role in ("Sales Manager", "System Manager"):
        users = frappe.get_all(
            "Has Role", filters={"role": role, "parenttype": "User"}, pluck="parent"
        )
        for u in users:
            if u not in ("Administrator", "Guest"):
                recipients.add(u)

    if not recipients:
        recipients.add("Administrator")

    preview = (doc.get("message") or "")[:140]

    for user in recipients:
        frappe.get_doc({
            "doctype": "CRM Notification",
            "type": "WhatsApp",
            "from_user": "Guest",
            "to_user": user,
            "reference_doctype": ref_doctype,
            "reference_name": ref_name,
            "message": f"You received a whatsapp message from {display_name} ({phone}): {preview}"
        }).insert(ignore_permissions=True)

def sync_conversation(doc, method):
    phone = doc.get("from") if doc.type == "Incoming" else doc.get("to")
    if not phone:
        return

    display_name, contact = _get_display_name(phone)

    if not contact and doc.get("profile_name"):
        new_contact = frappe.get_doc({
            "doctype": "Contact",
            "first_name": doc.get("profile_name"),
            "phone_nos": [{"phone": phone}]
        })
        new_contact.insert(ignore_permissions=True)
        contact = new_contact.name
        display_name = doc.get("profile_name")

    if not frappe.db.exists("WhatsApp Conversation", phone):
        conv = frappe.get_doc({
            "doctype": "WhatsApp Conversation",
            "phone_number": phone,
            "contact_name": display_name,
            "contact": contact,
            "whatsapp_account": doc.get("whatsapp_account"),
            "reference_doctype": doc.get("reference_doctype") if doc.get("reference_doctype") != "Contact" else None,
            "reference_name": doc.get("reference_name") if doc.get("reference_doctype") != "Contact" else None,
        })
        conv.insert(ignore_permissions=True)
    else:
        conv = frappe.get_doc("WhatsApp Conversation", phone)
        if display_name and display_name != phone:
            conv.contact_name = display_name
        if contact:
            conv.contact = contact
        if doc.get("reference_doctype") and doc.get("reference_doctype") != "Contact":
            conv.reference_doctype = doc.get("reference_doctype")
            conv.reference_name = doc.get("reference_name")

    conv.last_message = (doc.get("message") or "")[:140]
    conv.last_message_time = doc.get("creation") or frappe.utils.now()
    if doc.type == "Incoming":
        conv.unread_count = (conv.unread_count or 0) + 1
    conv.save(ignore_permissions=True)

    if doc.type == "Incoming":
        ref_doctype = conv.reference_doctype or "Contact"
        ref_name = conv.reference_name or conv.contact or None
        _notify_agents(doc, display_name, phone, contact, ref_doctype, ref_name)
