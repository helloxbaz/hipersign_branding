frappe.ui.form.on('*', {
    refresh: function(frm) {

        if (frm.is_new()) return;

        setTimeout(() => {

            // Remove duplicates
            frm.page.menu.find('[data-label="View PDF"]').remove();
            frm.page.menu.find('[data-label="Download PDF"]').remove();
            frm.page.menu.find('[data-label="Share PDF"]').remove();

            // Generate PDF URL
            function get_pdf_url() {
                return (
                    "/api/method/frappe.utils.print_format.download_pdf?" +
                    "doctype=" + encodeURIComponent(frm.doctype) +
                    "&name=" + encodeURIComponent(frm.doc.name) +
                    "&format=" + encodeURIComponent(frm.meta.default_print_format || "") +
                    "&no_letterhead=0" +
                    "&settings=%7B%7D" +
                    "&_lang=" + frappe.boot.lang +
                    "&pdf_generator=wkhtmltopdf"
                );
            }

            // -------------------------
            // 1️⃣ VIEW PDF
            // -------------------------
            frm.page.add_menu_item(__('View PDF'), function () {
                window.open(get_pdf_url(), "_blank");
            });

            // -------------------------
            // 2️⃣ DOWNLOAD PDF
            // -------------------------
            frm.page.add_menu_item(__('Download PDF'), async function () {

                try {
                    let response = await fetch(get_pdf_url());
                    let blob = await response.blob();

                    let link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = frm.doc.name + ".pdf";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                } catch (err) {
                    console.error(err);
                    frappe.msgprint("Unable to download file.");
                }

            });

            // -------------------------
            // 3️⃣ SHARE PDF
            // -------------------------
            frm.page.add_menu_item(__('Share PDF'), async function () {

                try {

                    let response = await fetch(get_pdf_url());
                    let blob = await response.blob();

                    let file = new File(
                        [blob],
                        frm.doc.name + ".pdf",
                        { type: "application/pdf" }
                    );

                    // If mobile supports file sharing
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {

                        await navigator.share({
                            files: [file],
                            title: frm.doc.name,
                            text: "Here is your document"
                        });

                    } else {

                        // Fallback = normal download
                        let link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = frm.doc.name + ".pdf";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                    }

                } catch (err) {
                    console.error(err);
                    frappe.msgprint("Unable to share file.");
                }

            });

        }, 300);
    }
});
