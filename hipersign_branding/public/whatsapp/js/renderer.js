window.HSWhatsAppRenderer = (() => {

    const { escapeHTML, getInitials, formatTime } = HSWhatsAppUtils;

    const EMOJIS = ["😊","😂","❤️","👍","🙏","😍","😢","😮","🎉","🔥",
                    "👏","😅","🤔","😎","💯","✅","❌","📌","⭐","🙌",
                    "😁","😉","😭","🥳","🤝","👋","💪","🚀","📞","💚"];


   function renderStatus(status) {
        const s = (status || "").toLowerCase();

        if (s === "failed") {
            return `<span class="wa-status-failed">failed</span>`;
        }
        if (s === "read") {
            return `<span class="wa-status-tick wa-status-read">✓✓</span>`;
        }
        if (s === "delivered") {
            return `<span class="wa-status-tick">✓✓</span>`;
        }
        if (s === "queued") {
            return `<span class="wa-status-tick">🕐</span>`;
        }
        if (s === "success" || s === "sent") {
            return `<span class="wa-status-tick">✓</span>`;
        }
        return "";
    }

    function renderConversationList(container, conversations = [], selectedPhone = null) {

        if (!container) return;

        conversations = Array.isArray(conversations) ? conversations : [];

        if (conversations.length === 0) {
            container.innerHTML = `
                <div class="wa-empty">
                    <div class="wa-empty-icon">💬</div>
                    <div class="wa-empty-title">No conversations</div>
                </div>
            `;
            return;
        }

        container.innerHTML = conversations.map(c => {

            const active = c.phone_number === selectedPhone ? "active" : "";
            const initials = getInitials(c.customer_name || c.phone_number);

            return `
<div class="wa-conversation ${active}" data-phone="${escapeHTML(c.phone_number)}">
    <div class="wa-avatar">${escapeHTML(initials)}</div>
    <div class="wa-conversation-info">
        <div class="wa-conversation-row">
            <div class="wa-name">${escapeHTML(c.customer_name || c.phone_number)}</div>
            <div class="wa-time">${formatTime(c.last_message_time)}</div>
        </div>
        <div class="wa-conversation-row">
            <div class="wa-preview">${escapeHTML(c.last_message || "No messages")}</div>
            ${c.unread_count > 0 ? `<div class="wa-unread">${c.unread_count}</div>` : ""}
        </div>
    </div>
</div>
`;
        }).join("");
    }

    function renderHeader(container, conversation) {

        if (!container) return;

        if (!conversation) {
            container.innerHTML = `<div class="wa-header-empty">Select a conversation</div>`;
            return;
        }

        const initials = getInitials(conversation.customer_name || conversation.phone_number);

        let linkDoctype = "";
        let linkName = "";
        if (conversation.contact) {
            linkDoctype = "Contact";
            linkName = conversation.contact;
        } else if (conversation.reference_doctype && conversation.reference_name) {
            linkDoctype = conversation.reference_doctype;
            linkName = conversation.reference_name;
        }

        const clickable = linkDoctype ? "wa-header-clickable" : "";

        container.innerHTML = `
<div class="wa-chat-header-inner">
    <div class="wa-header-profile ${clickable}" data-doctype="${escapeHTML(linkDoctype)}" data-name="${escapeHTML(linkName)}">
        <div class="wa-avatar large">${escapeHTML(initials)}</div>
        <div class="wa-header-details">
            <div class="wa-header-name">${escapeHTML(conversation.customer_name || conversation.phone_number)}</div>
            <div class="wa-header-phone">${escapeHTML(conversation.phone_number)}</div>
        </div>
    </div>
    <div class="wa-header-actions">
        <button class="wa-icon-btn wa-refresh-btn" title="Refresh">⟳</button>
    </div>
</div>
`;
    }

    function renderMessages(container, messages = []) {

        if (!container) return;

        messages = Array.isArray(messages) ? messages : [];

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="wa-chat-empty">
                    <div class="wa-chat-empty-icon">💬</div>
                    <h3>No messages yet</h3>
                    <p>Start the conversation by sending a message.</p>
                </div>
            `;
            return;
        }

container.innerHTML = messages.map(message => {

            const outgoing = message.type === "Outgoing";
            const isTemplate = message.message_type === "Template";
            const hasAttach = !!message.attach;
            const statusHtml = outgoing ? renderStatus(message.status) : "";
            const failed = outgoing && (message.status || "").toLowerCase() === "failed";

            return `
                <div class="wa-message ${outgoing ? "outgoing" : "incoming"}">
                    <div class="wa-bubble ${isTemplate ? "wa-bubble-template" : ""} ${failed ? "wa-bubble-failed" : ""}">
                        ${isTemplate ? `<div class="wa-template-tag">📄 ${escapeHTML(message.template || "Template")}</div>` : ""}
                        ${hasAttach ? `<a href="${escapeHTML(message.attach)}" target="_blank" class="wa-attachment-link">📎 ${escapeHTML(message.message || "Attachment")}</a>` : escapeHTML(message.message || "")}
                        <div class="wa-message-footer">
                            <span class="wa-message-time">${formatTime(message.creation)}</span>
                            ${statusHtml}
                        </div>
                    </div>
                </div>
            `;

        }).join("");

    }

    function renderEmptyState(container) {

        if (!container) return;

        container.innerHTML = `
            <div class="wa-welcome">
                <div class="wa-welcome-icon">💚</div>
                <h2>Welcome to Hipersign WhatsApp</h2>
                <p>Select a conversation to begin chatting.</p>
            </div>
        `;
    }

   function renderSearchResults(container, results = []) {
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="wa-empty">
                    <div class="wa-empty-icon">🔍</div>
                    <div class="wa-empty-title">No matches found</div>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map(r => {
            const initials = getInitials(r.customer_name || r.phone_number);
            const isNew = r.isNew ? `<span class="wa-new-tag">New</span>` : "";

            return `
<div class="wa-conversation" data-phone="${escapeHTML(r.phone_number)}">
    <div class="wa-avatar">${escapeHTML(initials)}</div>
    <div class="wa-conversation-info">
        <div class="wa-conversation-row">
            <div class="wa-name">${escapeHTML(r.customer_name || r.phone_number)} ${isNew}</div>
            <div class="wa-time">${r.last_message_time ? formatTime(r.last_message_time) : ""}</div>
        </div>
        <div class="wa-conversation-row">
            <div class="wa-preview">${escapeHTML(r.last_message || r.phone_number)}</div>
            ${r.unread_count > 0 ? `<div class="wa-unread">${r.unread_count}</div>` : ""}
        </div>
    </div>
</div>
`;
        }).join("");
    }



    function renderEmojiPicker(container) {
        if (!container) return;
        container.innerHTML = EMOJIS.map(e => `<button type="button" class="wa-emoji-item">${e}</button>`).join("");
    }

    return {
        renderConversationList,
        renderHeader,
        renderMessages,
        renderEmptyState,
        renderEmojiPicker,
        renderSearchResults
    };

})();
