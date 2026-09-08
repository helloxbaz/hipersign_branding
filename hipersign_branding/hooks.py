app_name = "hipersign_branding"
app_title = "Hipersign Branding"
app_publisher = "Hipersign Technologies"
app_description = "Branding"
app_email = "support@hipersignerp.com"
app_license = "mit"

after_install = "hipersign_branding.setup.apply_branding"
after_migrate = "hipersign_branding.setup.apply_branding"

# --- BRANDING OVERRIDES (Crucial for removing "E" logo) ---
app_logo_url = "/assets/hipersign_branding/images/hipersign-loader.png"

website_context = {
	"favicon": "/assets/hipersign_branding/images/hipersign-loader.png",
	"splash_image": "/assets/hipersign_branding/images/hipersign-loader.png",
	"brand_html": '<img src="/assets/hipersign_branding/images/hipersign-loader.png" style="height: 30px;">',
}
# ----------------------------------------------------------

# Includes in <head>
# ------------------
app_include_css = "/assets/hipersign_branding/css/branding.css"
app_include_js = [
	"/assets/hipersign_branding/js/branding.js",
	"/assets/hipersign_branding/js/global_print_button.js",
	"/assets/hipersign_branding/js/pwa.js",
]

# Fixtures
# --------
# The doc_events below read custom fields on CRM Task and ToDo. Without these
# shipped as fixtures, a fresh install has the hooks but not the fields, and
# the first CRM Task insert raises AttributeError — which breaks the ERPNext
# setup wizard when it generates CRM demo data.
fixtures = [
	{
		"dt": "Custom Field",
		"filters": [
			[
				"name",
				"in",
				[
					"CRM Task-custom_visit_type",
					"CRM Task-custom_location",
					"CRM Task-custom_send_whatsapp_reminder",
					"CRM Task-custom_reminder_date",
					"CRM Task-custom_reminder_sent",
					"ToDo-custom_send_whatsapp_reminder",
					"ToDo-custom_reminder_date",
					"CRM Deal-erpnext_customer",
				],
			]
		],
	}
]

# Document Events
# ---------------
doc_events = {
	"WhatsApp Message": {
		"after_insert": "hipersign_branding.whatsapp_hooks.sync_conversation"
	},
	"CRM Task": {
		"after_insert": "hipersign_branding.task_notification_hooks.sync_task_fields_to_todo",
		"on_update": "hipersign_branding.task_notification_hooks.sync_task_fields_to_todo",
	},
}

scheduler_events = {
	"cron": {
		"*/5 * * * *": ["hipersign_branding.task_notification_hooks.send_due_reminders"]
	}
}
