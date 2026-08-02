frappe.pages["whatsapp-inbox"] = frappe.pages["whatsapp-inbox"] || {};

frappe.pages["whatsapp-inbox"].on_page_load = function (wrapper) {
    frappe.ui.make_app_page({
        parent: wrapper,
        title: "WhatsApp Inbox",
        single_column: true
    });
};

frappe.pages["whatsapp-inbox"].on_page_show = async function (wrapper) {

    if (!document.getElementById("hs-whatsapp-css")) {
        const link = document.createElement("link");
        link.id = "hs-whatsapp-css";
        link.rel = "stylesheet";
        link.href = "/assets/hipersign_branding/whatsapp/css/whatsapp.css?v=" + Date.now();
        document.head.appendChild(link);
    }

    await new Promise(resolve => {
        frappe.require([
            "/assets/hipersign_branding/whatsapp/js/api.js",
            "/assets/hipersign_branding/whatsapp/js/utils.js",
            "/assets/hipersign_branding/whatsapp/js/renderer.js",
            "/assets/hipersign_branding/whatsapp/js/events.js",
            "/assets/hipersign_branding/whatsapp/js/layout.js",
            "/assets/hipersign_branding/whatsapp/js/app.js"
        ], resolve);
    });

    const page = wrapper.page;
    page.body.html(HSWhatsAppLayout.render());

    const app = new HSWhatsAppApp({
        appRoot: page.body.find(".wa-app")[0],
        sidebar: page.body.find(".wa-conversation-list")[0],
        chatHeader: page.body.find(".wa-chat-header-content")[0],
        chatBody: page.body.find(".wa-chat-body")[0],
        input: page.body.find(".wa-message-input")[0],
        sendButton: page.body.find(".wa-send-btn")[0],
        templateButton: page.body.find(".wa-template-btn")[0],
        emojiButton: page.body.find(".wa-emoji-btn")[0],
        emojiPicker: page.body.find(".wa-emoji-picker")[0],
        attachButton: page.body.find(".wa-attach-btn")[0],
        backButton: page.body.find(".wa-back-btn")[0],
        searchInput: page.body.find(".wa-search-input")[0]
    });

    await app.init();
};
