frappe.provide("hipersign.branding");

hipersign.branding.deep_replace = function() {
    // Create a "Tree Walker" that looks ONLY at text nodes
    var walker = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        null, 
        false
    );

    var node;
    while(node = walker.nextNode()) {
        // Check if the text contains "ERPNext"
        if (node.nodeValue && node.nodeValue.includes("ERPNext")) {

            // Exclude the console/debugger itself from being replaced
            if (node.parentElement && node.parentElement.tagName === "SCRIPT") continue;

            console.log("Hipersign: Found 'ERPNext' -> Replacing...");

            // Replace the text
            node.nodeValue = node.nodeValue.replace(/ERPNext/g, "Hipersign ERP");

            // Ensure the parent element is visible (fixes any leftover CSS hiding)
            if (node.parentElement) {
                 node.parentElement.style.visibility = 'visible';
            }
        }
    }
};

$(document).ready(function() {
    console.log("Hipersign Branding: Deep Scanner Loaded 🚀");

    // Run immediately
    hipersign.branding.deep_replace();

    // Run repeatedly to catch dynamic updates (Vue.js re-renders)
    setInterval(hipersign.branding.deep_replace, 1000);
});
