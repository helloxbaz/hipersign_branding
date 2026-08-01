import frappe
import json
from frappe.utils import now_datetime, get_datetime, format_datetime


def _get_entity_line(task):
    if task.reference_doctype == "CRM Deal" and task.reference_docname:
        deal = frappe.db.get_value(
            "CRM Deal", task.reference_docname, ["organization_name", "organization"], as_dict=True
        )
        if deal:
            org_display = deal.organization_name
            if not org_display and deal.organization:
                org_display = frappe.db.get_value("CRM Organization", deal.organization, "organization_name") or deal.organization
            name = org_display or task.reference_docname
            return f"Deal: {name}"



    if task.reference_doctype == "CRM Lead" and task.reference_docname:
        lead = frappe.db.get_value(
            "CRM Lead", task.reference_docname, ["organization", "lead_name"], as_dict=True
        )
        if lead:
            name = lead.organization or lead.lead_name or task.reference_docname
            return f"Lead: {name}"

    if task.reference_doctype and task.reference_docname:
        org_name = (
            frappe.db.get_value(task.reference_doctype, task.reference_docname, "organization")
            or frappe.db.get_value(task.reference_doctype, task.reference_docname, "customer_name")
            or task.reference_docname
        )
        return f"Customer: {org_name}"

    return "Task"


def sync_task_fields_to_todo(doc, method):
    if method == "on_update" and doc.has_value_changed("custom_reminder_date") and doc.custom_reminder_sent:
        doc.db_set("custom_reminder_sent", 0, update_modified=False)

    frappe.db.sql("""
        update `tabToDo`
        set custom_send_whatsapp_reminder = %(reminder)s,
            custom_reminder_date = %(date)s
        where reference_type = 'CRM Task'
          and reference_name = %(task)s
    """, {
        "reminder": doc.custom_send_whatsapp_reminder or 0,
        "date": doc.custom_reminder_date,
        "task": doc.name
    })
    frappe.db.commit()




def send_due_reminders():
    tasks = frappe.get_all(
        "CRM Task",
      
      filters=[
            ["custom_send_whatsapp_reminder", "=", 1],
            ["custom_reminder_sent", "=", 0],
            ["custom_reminder_date", "<=", now_datetime()],
            ["custom_reminder_date", "is", "set"],
            ["assigned_to", "is", "set"],
        ],

        fields=["name", "assigned_to", "description", "due_date", "reference_doctype", "reference_docname", "custom_reminder_date"]
    )

    for task in tasks:
        if not task.custom_reminder_date or get_datetime(task.custom_reminder_date) > now_datetime():
            continue

        user = task.assigned_to
        mobile_no = frappe.db.get_value("User", user, "mobile_no") or frappe.db.get_value("User", user, "phone")
        if not mobile_no:
            frappe.db.set_value("CRM Task", task.name, "custom_reminder_sent", 1)
            continue

        entity_line = _get_entity_line(task)
        description = frappe.utils.strip_html(task.description or "")[:150]
        due_date_str = format_datetime(task.due_date, "dd-MM-yyyy HH:mm") if task.due_date else "Not set"

        frappe.get_doc({
            "doctype": "WhatsApp Message",
            "type": "Outgoing",
            "to": mobile_no,
            "use_template": 1,
            "template": "task_reminder_notification_v2-",
            "body_param": frappe.as_json({
                "1": entity_line,
                "2": description,
                "3": due_date_str
            }),
            "content_type": "text",
            "message_type": "Template"
        }).insert(ignore_permissions=True)

        frappe.db.set_value("CRM Task", task.name, "custom_reminder_sent", 1)

    frappe.db.commit()
