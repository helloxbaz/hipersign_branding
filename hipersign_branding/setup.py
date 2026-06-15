import frappe

def apply_branding():
    # Website Settings — app/site name and logo
    ws = frappe.get_single("Website Settings")
    ws.app_name = "Hipersign ERP"
    ws.website_name = "Hipersign ERP"
    # logo served from your app's public folder
    ws.app_logo = "/assets/hipersign_branding/images/hipersign-loader.png"
    ws.banner_image = "/assets/hipersign_branding/images/hipersign-loader.png"
    ws.favicon = "/assets/hipersign_branding/images/hipersign-loader.png"
    ws.save(ignore_permissions=True)

    # Navbar Settings — navbar logo + app name
    nav = frappe.get_single("Navbar Settings")
    nav.app_logo = "/assets/hipersign_branding/images/hipersign-loader.png"
    nav.save(ignore_permissions=True)

    frappe.db.commit()
