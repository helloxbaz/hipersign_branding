app_name = "hipersign_branding"
app_title = "Hipersign Branding"
app_publisher = "Hipersign Technologies"
app_description = "Branding"
app_email = "support@hipersignerp.com"
app_license = "mit"

# --- BRANDING OVERRIDES (Crucial for removing "E" logo) ---
app_logo_url = "/assets/hipersign_branding/images/hipersign-loader.png"

website_context = {
    "favicon": "/assets/hipersign_branding/images/hipersign-loader.png",
    "splash_image": "/assets/hipersign_branding/images/hipersign-loader.png",
    "brand_html": '<img src="/assets/hipersign_branding/images/hipersign-loader.png" style="height: 30px;">'
}
# ----------------------------------------------------------

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# Note: Ensure your file is named 'branding.css' in the public/css folder
app_include_css = "/assets/hipersign_branding/css/branding.css"
app_include_js = [
    "/assets/hipersign_branding/js/branding.js",
    "/assets/hipersign_branding/js/global_print_button.js"
]
# Document Events
# ---------------
# doc_events = {
#       "*": {
#               "on_update": "method",
#               "on_cancel": "method",
#               "on_trash": "method"
#       }
# }


