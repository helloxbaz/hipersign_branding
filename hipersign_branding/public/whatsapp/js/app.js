window.HSWhatsAppApp = class {

    constructor(elements) {
        this.appRoot = elements.appRoot;
        this.sidebar = elements.sidebar;
        this.chatBody = elements.chatBody;
        this.chatHeader = elements.chatHeader;
        this.input = elements.input;
        this.sendButton = elements.sendButton;
        this.templateButton = elements.templateButton;
        this.emojiButton = elements.emojiButton;
        this.emojiPicker = elements.emojiPicker;
        this.attachButton = elements.attachButton;
        this.backButton = elements.backButton;
        this.searchInput = elements.searchInput;

        this.conversations = [];
        this.activeConversation = null;
    }

    async init() {
        HSWhatsAppRenderer.renderEmptyState(this.chatBody);
        await this.loadConversations();
        if (this.emojiPicker) HSWhatsAppRenderer.renderEmojiPicker(this.emojiPicker);
        HSWhatsAppEvents.initialize(this);
    }

    async loadConversations() {
        const data = await HSWhatsAppAPI.getConversations();
        this.conversations = Array.isArray(data) ? data : [];
        this.renderConversationList();
    }

    renderConversationList() {
        HSWhatsAppRenderer.renderConversationList(
            this.sidebar,
            this.conversations,
            this.activeConversation ? this.activeConversation.phone_number : null
        );
    }

    async openConversation(phone) {
        this.activeConversation = this.conversations.find(c => c.phone_number === phone);
        if (!this.activeConversation) return;

        this.renderConversationList();
        HSWhatsAppRenderer.renderHeader(this.chatHeader, this.activeConversation);

        this.chatBody.innerHTML = "<div class='wa-loading'>Loading...</div>";

        const messages = await HSWhatsAppAPI.getMessages(phone);
        HSWhatsAppRenderer.renderMessages(this.chatBody, messages);
        HSWhatsAppUtils.scrollBottom(this.chatBody);

        await HSWhatsAppAPI.markRead(phone);
        this.activeConversation.unread_count = 0;
        this.renderConversationList();

        if (this.appRoot) this.appRoot.classList.add("wa-chat-active");
    }

    goBackToList() {
        if (this.appRoot) this.appRoot.classList.remove("wa-chat-active");
    }

    async sendMessage(text) {
        if (!this.activeConversation) return;
        await HSWhatsAppAPI.sendMessage(this.activeConversation.phone_number, text);
        await this.openConversation(this.activeConversation.phone_number);
        await this.loadConversations();
    }

   async handleSearch(query) {
        query = (query || "").trim();

        if (!query) {
            this.renderConversationList();
            return;
        }

        const existingMatches = this.conversations.filter(c =>
            (c.customer_name || "").toLowerCase().includes(query.toLowerCase()) ||
            (c.phone_number || "").includes(query)
        );

        const contactResults = await HSWhatsAppAPI.searchContacts(query);

        const existingPhones = new Set(this.conversations.map(c => c.phone_number));
        const newContacts = contactResults
            .filter(c => !existingPhones.has(c.phone_number))
            .map(c => ({ ...c, isNew: true }));

        HSWhatsAppRenderer.renderSearchResults(this.sidebar, [...existingMatches, ...newContacts]);
    }

    async startConversationWith(phone, customerName) {
        let conv = this.conversations.find(c => c.phone_number === phone);

        if (!conv) {
            conv = {
                phone_number: phone,
                customer_name: customerName,
                contact_name: customerName,
                last_message: "",
                last_message_time: null,
                unread_count: 0
            };
            this.conversations.unshift(conv);
        }

        await this.openConversation(phone);
    }


    toggleEmojiPicker() {
        if (!this.emojiPicker) return;
        this.emojiPicker.classList.toggle("open");
    }

    closeEmojiPicker() {
        if (!this.emojiPicker) return;
        this.emojiPicker.classList.remove("open");
    }

    insertEmoji(emoji) {
        if (!this.input) return;
        const start = this.input.selectionStart ?? this.input.value.length;
        const end = this.input.selectionEnd ?? this.input.value.length;
        const value = this.input.value;
        this.input.value = value.slice(0, start) + emoji + value.slice(end);
        this.input.focus();
        this.input.selectionStart = this.input.selectionEnd = start + emoji.length;
    }

    async openTemplateDialog() {
        if (!this.activeConversation) {
            frappe.msgprint("Select a conversation first.");
            return;
        }

        const templates = await HSWhatsAppAPI.getTemplates();

        if (!templates.length) {
            frappe.msgprint("No WhatsApp templates found.");
            return;
        }

        const dialog = new frappe.ui.Dialog({
            title: "Send Template",
            fields: [
                {
                    fieldname: "template",
                    label: "Template",
                    fieldtype: "Select",
                    options: templates.map(t => t.name),
                    reqd: 1,
                    onchange: () => this._renderTemplatePreview(dialog, templates)
                },
                { fieldname: "preview", fieldtype: "HTML" },
                {
                    fieldname: "params",
                    label: "Placeholder Values (comma separated)",
                    fieldtype: "Data",
                    description: "Fill values in order for {{1}}, {{2}}, etc. Leave blank if template has none."
                }
            ],
            primary_action_label: "Send",
            primary_action: async (values) => {
                const params = values.params ? values.params.split(",").map(p => p.trim()) : [];
                await HSWhatsAppAPI.sendTemplate(this.activeConversation.phone_number, values.template, params);
                dialog.hide();
                await this.openConversation(this.activeConversation.phone_number);
                await this.loadConversations();
            }
        });

        dialog.show();
        this._renderTemplatePreview(dialog, templates);
    }

    _renderTemplatePreview(dialog, templates) {
        const selected = templates.find(t => t.name === dialog.get_value("template"));
        const previewField = dialog.get_field("preview");
        if (selected && previewField) {
            previewField.$wrapper.html(
                `<div class="wa-template-preview">${HSWhatsAppUtils.escapeHTML(selected.template || "")}</div>`
            );
        }
    }

    handleAttach() {
        if (!this.activeConversation) {
            frappe.msgprint("Select a conversation first.");
            return;
        }

        new frappe.ui.FileUploader({
            doctype: "WhatsApp Message",
            allow_multiple: false,
            on_success: async (file) => {
                await HSWhatsAppAPI.sendAttachment(
                    this.activeConversation.phone_number,
                    file.file_url,
                    file.file_name
                );
                await this.openConversation(this.activeConversation.phone_number);
                await this.loadConversations();
            }
        });
    }

};
