import json
import mimetypes

import frappe

DEFAULT_ICON = "/assets/hipersign_branding/images/hipersign-loader.png"
APP_NAME = "Hipersign ERP"


def _single(doctype, field):
	try:
		return (frappe.db.get_single_value(doctype, field) or "").strip()
	except Exception:
		return ""


@frappe.whitelist(allow_guest=True, methods=["GET"])
def manifest():
	"""Return a consistent PWA manifest for every Hipersign ERP site."""
	logo = _single("Website Settings", "app_logo") or DEFAULT_ICON
	icon_type = mimetypes.guess_type(logo)[0] or "image/png"

	data = {
		"id": "/",
		"name": APP_NAME,
		"short_name": "Hipersign ERP",
		"description": "Hipersign ERP",
		"start_url": "/app",
		"scope": "/",
		"display": "standalone",
		"background_color": "#ffffff",
		"theme_color": "#000000",
		"icons": [
			{"src": logo, "sizes": "any", "type": icon_type},
		],
	}

	frappe.response["type"] = "binary"
	frappe.response["filename"] = "manifest.json"
	frappe.response["filecontent"] = json.dumps(data)
	frappe.response["display_content_as"] = "inline"
