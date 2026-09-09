import frappe
from frappe.utils import format_datetime, get_datetime, now_datetime

TASK_FIELDS = ("custom_send_whatsapp_reminder", "custom_reminder_date", "custom_reminder_sent")
TODO_FIELDS = ("custom_send_whatsapp_reminder", "custom_reminder_date")


def _fields_present(doctype, fieldnames):
	"""True only if every field exists on the doctype.

	The custom fields ship as fixtures, but fixtures are not guaranteed to have
	run yet — during install, during the setup wizard's demo data, or on a site
	where someone removed them. Reading a missing field raises AttributeError
	and, because these are doc_events, that aborts the document insert itself.
	"""
	if not frappe.db.exists("DocType", doctype):
		return False

	meta = frappe.get_meta(doctype)
	return all(meta.has_field(f) for f in fieldnames)


def _get_entity_line(task):
	if task.reference_doctype == "CRM Deal" and task.reference_docname:
		deal = frappe.db.get_value(
			"CRM Deal",
			task.reference_docname,
			["organization_name", "organization"],
			as_dict=True,
		)
		if deal:
			org_display = deal.organization_name
			if not org_display and deal.organization:
				org_display = (
					frappe.db.get_value("CRM Organization", deal.organization, "organization_name")
					or deal.organization
				)
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
	# Both sides must have the fields: this reads from CRM Task and writes to ToDo.
	if not _fields_present("CRM Task", TASK_FIELDS):
		return
	if not _fields_present("ToDo", TODO_FIELDS):
		return

	if (
		method == "on_update"
		and doc.has_value_changed("custom_reminder_date")
		and doc.get("custom_reminder_sent")
	):
		doc.db_set("custom_reminder_sent", 0, update_modified=False)

	frappe.db.sql(
		"""
		update `tabToDo`
		set custom_send_whatsapp_reminder = %(reminder)s,
			custom_reminder_date = %(date)s
		where reference_type = 'CRM Task'
		  and reference_name = %(task)s
		""",
		{
			"reminder": doc.get("custom_send_whatsapp_reminder") or 0,
			"date": doc.get("custom_reminder_date"),
			"task": doc.name,
		},
	)
	frappe.db.commit()


def send_due_reminders():
	if not _fields_present("CRM Task", TASK_FIELDS):
		return

	tasks = frappe.get_all(
		"CRM Task",
		filters=[
			["custom_send_whatsapp_reminder", "=", 1],
			["custom_reminder_sent", "=", 0],
			["custom_reminder_date", "<=", now_datetime()],
			["custom_reminder_date", "is", "set"],
			["assigned_to", "is", "set"],
		],
		fields=[
			"name",
			"assigned_to",
			"description",
			"due_date",
			"reference_doctype",
			"reference_docname",
			"custom_reminder_date",
		],
	)

	for task in tasks:
		if not task.custom_reminder_date or get_datetime(task.custom_reminder_date) > now_datetime():
			continue

		user = task.assigned_to
		mobile_no = frappe.db.get_value("User", user, "mobile_no") or frappe.db.get_value(
			"User", user, "phone"
		)
		if not mobile_no:
			frappe.db.set_value("CRM Task", task.name, "custom_reminder_sent", 1)
			continue

		entity_line = _get_entity_line(task)
		description = frappe.utils.strip_html(task.description or "")[:150]
		due_date_str = (
			format_datetime(task.due_date, "dd-MM-yyyy HH:mm") if task.due_date else "Not set"
		)

		try:
			frappe.get_doc(
				{
					"doctype": "WhatsApp Message",
					"type": "Outgoing",
					"to": mobile_no,
					"use_template": 1,
					"template": "task_reminder_notification_v2-",
					"body_param": frappe.as_json(
						{"1": entity_line, "2": description, "3": due_date_str}
					),
					"content_type": "text",
					"message_type": "Template",
				}
			).insert(ignore_permissions=True)
		except Exception:
			# One bad number or a missing template should not stop the whole run.
			frappe.log_error(
				title="Task reminder failed", message=f"CRM Task {task.name}"
			)
			continue

		frappe.db.set_value("CRM Task", task.name, "custom_reminder_sent", 1)

	frappe.db.commit()
