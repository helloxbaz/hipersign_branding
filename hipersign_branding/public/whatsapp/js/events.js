window.HSWhatsAppEvents = (() => {

    function initialize(app) {

       app.sidebar.addEventListener("click", async (e) => {
            const row = e.target.closest(".wa-conversation");
            if (!row) return;

            const phone = row.dataset.phone;
            const existing = app.conversations.find(c => c.phone_number === phone);

            if (existing) {
                await app.openConversation(phone);
            } else {
                const nameEl = row.querySelector(".wa-name");
                const name = nameEl ? nameEl.textContent.replace("New", "").trim() : phone;
                await app.startConversationWith(phone, name);
            }

            if (app.searchInput) app.searchInput.value = "";
        });

        app.sendButton.addEventListener("click", async () => {
            await sendCurrentMessage(app);
        });

        app.input.addEventListener("keydown", async (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                await sendCurrentMessage(app);
            }
        });

        if (app.templateButton) {
            app.templateButton.addEventListener("click", async () => {
                await app.openTemplateDialog();
            });
        }

        if (app.emojiButton) {
            app.emojiButton.addEventListener("click", (e) => {
                e.stopPropagation();
                app.toggleEmojiPicker();
            });
        }

        if (app.emojiPicker) {
            app.emojiPicker.addEventListener("click", (e) => {
                const btn = e.target.closest(".wa-emoji-item");
                if (!btn) return;
                app.insertEmoji(btn.textContent);
            });
        }

        document.addEventListener("click", (e) => {
            if (app.emojiPicker && !e.target.closest(".wa-emoji-wrapper")) {
                app.closeEmojiPicker();
            }
        });

        if (app.attachButton) {
            app.attachButton.addEventListener("click", () => {
                app.handleAttach();
            });
        }

        if (app.backButton) {
            app.backButton.addEventListener("click", () => {
                app.goBackToList();
            });
        }

       if (app.searchInput) {
            const debouncedSearch = HSWhatsAppUtils.debounce((value) => {
                app.handleSearch(value);
            }, 300);

            app.searchInput.addEventListener("input", (e) => {
                debouncedSearch(e.target.value);
            });
        }


        app.chatHeader.addEventListener("click", async (e) => {

            if (e.target.closest(".wa-refresh-btn") && app.activeConversation) {
                await app.openConversation(app.activeConversation.phone_number);
                return;
            }

            const profile = e.target.closest(".wa-header-clickable");
            if (profile && profile.dataset.doctype && profile.dataset.name) {
                frappe.set_route("app", frappe.router.slug(profile.dataset.doctype), profile.dataset.name);
            }
        });
    }

    async function sendCurrentMessage(app) {
        const text = app.input.value.trim();
        if (!text || !app.activeConversation) return;
        app.input.value = "";
        await app.sendMessage(text);
    }

    return { initialize };

})();
