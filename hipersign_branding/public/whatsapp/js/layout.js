window.HSWhatsAppLayout = (() => {

    function render() {
        return `
<div class="wa-app">
    <aside class="wa-sidebar">
        <div class="wa-sidebar-header"><h2>WhatsApp</h2></div>
        <div class="wa-sidebar-search">
            <input type="text" class="wa-search-input" placeholder="Search conversations...">
        </div>
        <div class="wa-conversation-list"></div>
    </aside>

    <section class="wa-chat">
        <header class="wa-chat-header">
            <button class="wa-back-btn" type="button" title="Back">←</button>
            <div class="wa-chat-header-content"></div>
        </header>
        <main class="wa-chat-body"></main>
        <footer class="wa-chat-footer">
            <div class="wa-emoji-wrapper">
                <button class="wa-action wa-emoji-btn" type="button" title="Emoji">😊</button>
                <div class="wa-emoji-picker"></div>
            </div>
            <button class="wa-action wa-attach-btn" type="button" title="Attach">📎</button>
            <button class="wa-action wa-template-btn" type="button" title="Send Template">📄</button>
            <input type="text" class="wa-message-input" placeholder="Type a message...">
            <button class="wa-send-btn" type="button">Send</button>
        </footer>
    </section>
</div>
`;
    }

    return { render };

})();
