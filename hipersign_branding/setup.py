import frappe

def apply_branding():
    logo = "/assets/hipersign_branding/images/hipersign-loader.png"
    try:
        ws = frappe.get_single("Website Settings")
        ws.app_name = "Hipersign ERP"
        ws.app_logo = logo
        ws.banner_image = logo
        ws.splash_image = logo
        ws.favicon = logo
        ws.save(ignore_permissions=True)

        nav = frappe.get_single("Navbar Settings")
        nav.app_logo = logo
        nav.save(ignore_permissions=True)

        frappe.db.commit()
    except Exception:
        frappe.log_error("Hipersign branding apply failed")
