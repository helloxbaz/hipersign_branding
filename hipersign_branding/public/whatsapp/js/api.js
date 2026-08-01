window.HSWhatsAppAPI = (() => {

    const METHODS = {
        conversations: "hipersign_branding.api.get_conversations",
        messages: "hipersign_branding.api.get_messages",
        send: "hipersign_branding.api.send_message",
        markRead: "hipersign_branding.api.mark_read",
        templates: "hipersign_branding.api.get_templates",
        sendTemplate: "hipersign_branding.api.send_template",
        sendAttachment: "hipersign_branding.api.send_attachment",
        searchContacts: "hipersign_branding.api.search_contacts"
    };

    async function getConversations() {
        const r = await frappe.call({ method: METHODS.conversations });
        return r.message || [];
    }

    async function getMessages(phone) {
        const r = await frappe.call({ method: METHODS.messages, args: { phone_number: phone } });
        return r.message || [];
    }

    async function sendMessage(phone, text) {
        const r = await frappe.call({ method: METHODS.send, args: { phone_number: phone, text: text } });
        return r.message;
    }

    async function markRead(phone) {
        await frappe.call({ method: METHODS.markRead, args: { phone_number: phone } });
    }

    async function getTemplates() {
        const r = await frappe.call({ method: METHODS.templates });
        return r.message || [];
    }

    async function sendTemplate(phone, template, params) {
        const r = await frappe.call({
            method: METHODS.sendTemplate,
            args: { phone_number: phone, template: template, params: JSON.stringify(params || []) }
        });
        return r.message;
    }

    async function sendAttachment(phone, fileUrl, fileName) {
        const r = await frappe.call({
            method: METHODS.sendAttachment,
            args: { phone_number: phone, file_url: fileUrl, file_name: fileName }
        });
        return r.message;
    }


   async function searchContacts(query) {
        const r = await frappe.call({ method: METHODS.searchContacts, args: { query } });
        return r.message || [];
    }

    return {
        getConversations,
        getMessages,
        sendMessage,
        markRead,
        getTemplates,
        sendTemplate,
        sendAttachment,
        searchContacts
    };

})();
