import json
import mimetypes

import frappe

DEFAULT_ICON = "/assets/hipersign_branding/images/hipersign-loader.png"


def _single(doctype, field):
	try:
		return (frappe.db.get_single_value(doctype, field) or "").strip()
	except Exception:
		return ""


def _app_name():
	name = _single("Website Settings", "app_name")
	if not name:
		name = _single("System Settings", "app_name")
		if name.lower() == "frappe":
			name = ""
	if not name:
		name = (frappe.local.site or "ERP").split(".")[0].replace("-", " ").title()
	return name


@frappe.whitelist(allow_guest=True, methods=["GET"])
def manifest():
	"""Per-site PWA manifest, so each site installs under its own name."""
	name = _app_name()
	logo = _single("Website Settings", "app_logo") or DEFAULT_ICON
	icon_type = mimetypes.guess_type(logo)[0] or "image/png"

	data = {
		"name": name,
		"short_name": name[:12],
		"start_url": "/app",
		"scope": "/",
		"display": "standalone",
		"background_color": "#ffffff",
		"theme_color": "#2563eb",
		"icons": [
			{"src": logo, "sizes": "192x192", "type": icon_type},
			{"src": logo, "sizes": "512x512", "type": icon_type},
		],
	}

	frappe.response["type"] = "binary"
	frappe.response["filename"] = "manifest.json"
	frappe.response["filecontent"] = json.dumps(data)
	frappe.response["display_content_as"] = "inline"
