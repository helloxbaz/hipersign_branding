window.HSWhatsAppUtils = (() => {

    function escapeHTML(str = "") {
        const div = document.createElement("div");
        div.textContent = str == null ? "" : String(str);
        return div.innerHTML;
    }

    function getInitials(name = "") {
        return name
            .trim()
            .split(" ")
            .map(word => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();
    }

    function truncate(str = "", len = 40) {
        return str.length > len ? str.substring(0, len) + "…" : str;
    }

    function formatTime(datetime) {
        return frappe.datetime.str_to_user(datetime);
    }

    function scrollBottom(el) {
        if (el) el.scrollTop = el.scrollHeight;
    }
   

   function debounce(fn, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    return {
        escapeHTML,
        getInitials,
        truncate,
        formatTime,
        scrollBottom,
        debounce
    };

})();
