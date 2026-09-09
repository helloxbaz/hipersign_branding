import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

LOGO = "/assets/hipersign_branding/images/hipersign-loader.png"

# Custom fields the app's hooks depend on, grouped by doctype.
#
# These are created here rather than shipped as `fixtures` in hooks.py on
# purpose. Custom Field.dt is a Link to DocType, so a fixture referencing
# "CRM Task" fails link validation on any site where the crm app is not
# installed — which would abort `install-app hipersign_branding` entirely.
# Creating them here lets us skip the doctypes that aren't present.
CUSTOM_FIELDS = {
	"CRM Task": [
		{
			"fieldname": "custom_visit_type",
			"label": "Visit Type",
			"fieldtype": "Select",
			"options": "Client meeting\nArchitect meet\nInterior meet\nHospital visiting\nNew work site visiting\nAcademic visiting\nOther",
			"insert_after": "title",
			"in_list_view": 1,
			"in_standard_filter": 1,
		},
		{
			"fieldname": "custom_location",
			"label": "Location",
			"fieldtype": "Data",
			"insert_after": "custom_visit_type",
			"in_list_view": 1,
			"in_standard_filter": 1,
		},
		{
			"fieldname": "custom_send_whatsapp_reminder",
			"label": "Send WhatsApp Reminder",
			"fieldtype": "Check",
			"insert_after": "assigned_to",
		},
		{
			"fieldname": "custom_reminder_date",
			"label": "Reminder Date",
			"fieldtype": "Datetime",
			"insert_after": "custom_send_whatsapp_reminder",
		},
		{
			"fieldname": "custom_reminder_sent",
			"label": "Reminder Sent",
			"fieldtype": "Check",
			"default": "0",
			"insert_after": "custom_reminder_date",
			"read_only": 1,
			"hidden": 1,
		},
	],
	"CRM Deal": [
		{
			"fieldname": "erpnext_customer",
			"label": "Customer in ERPNext",
			"fieldtype": "Data",
			"insert_after": "lead_name",
		},
	],
	"ToDo": [
		{
			"fieldname": "custom_send_whatsapp_reminder",
			"label": "Send WhatsApp Reminder",
			"fieldtype": "Check",
			"insert_after": "allocated_to",
		},
		{
			"fieldname": "custom_reminder_date",
			"label": "Reminder Date",
			"fieldtype": "Datetime",
			"insert_after": "custom_send_whatsapp_reminder",
		},
	],
}


def apply_branding():
	ensure_custom_fields()
	apply_logos()


def ensure_custom_fields():
	"""Create only the fields whose doctype actually exists on this site."""
	present = {dt: fields for dt, fields in CUSTOM_FIELDS.items() if frappe.db.exists("DocType", dt)}

	if not present:
		return

	try:
		create_custom_fields(present, ignore_validate=True, update=True)
		frappe.db.commit()
	except Exception:
		frappe.log_error(title="Hipersign branding: custom field setup failed")


def apply_logos():
	try:
		ws = frappe.get_single("Website Settings")
		ws.app_name = "Hipersign ERP"
		ws.app_logo = LOGO
		ws.banner_image = LOGO
		ws.splash_image = LOGO
		ws.favicon = LOGO
		ws.save(ignore_permissions=True)

		nav = frappe.get_single("Navbar Settings")
		nav.app_logo = LOGO
		nav.save(ignore_permissions=True)

		frappe.db.commit()
	except Exception:
		frappe.log_error(title="Hipersign branding apply failed")
