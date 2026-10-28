frappe.ui.form.on('*', {
    refresh: function(frm) {

        if (frm.is_new()) return;

        setTimeout(() => {

            // Remove duplicates
            frm.page.menu.find('[data-label="View PDF"]').remove();
            frm.page.menu.find('[data-label="Download PDF"]').remove();
            frm.page.menu.find('[data-label="Share PDF"]').remove();

            // Use the PDF Generator set on the print format (chrome / wkhtmltopdf).
            // Hard-coding wkhtmltopdf broke designed formats that need Chrome.
            const pdf_generators = {};
            async function get_pdf_generator(format) {
                if (!format || format === "Standard") return "wkhtmltopdf";
                if (!(format in pdf_generators)) {
                    try {
                        let r = await frappe.db.get_value("Print Format", format, "pdf_generator");
                        pdf_generators[format] = (r && r.message && r.message.pdf_generator) || "wkhtmltopdf";
                    } catch (e) {
                        pdf_generators[format] = "wkhtmltopdf";
                    }
                }
                return pdf_generators[format];
            }

            // look it up now so Share stays fast (mobile share needs a quick tap response)
            get_pdf_generator(frm.meta.default_print_format || "");

            // Generate PDF URL
            async function get_pdf_url() {
                let format = frm.meta.default_print_format || "";
                let generator = await get_pdf_generator(format);
                return (
                    "/api/method/frappe.utils.print_format.download_pdf?" +
                    "doctype=" + encodeURIComponent(frm.doctype) +
                    "&name=" + encodeURIComponent(frm.doc.name) +
                    "&format=" + encodeURIComponent(format) +
                    "&no_letterhead=0" +
                    "&settings=%7B%7D" +
                    "&_lang=" + frappe.boot.lang +
                    "&pdf_generator=" + encodeURIComponent(generator)
                );
            }

            // -------------------------
            // 1️⃣ VIEW PDF
            // -------------------------
            frm.page.add_menu_item(__('View PDF'), async function () {
                // open the tab first so the popup blocker allows it
                let w = window.open("", "_blank");
                let url = await get_pdf_url();
                if (w) w.location.href = url; else window.open(url, "_blank");
            });

            // -------------------------
            // 2️⃣ DOWNLOAD PDF
            // -------------------------
            frm.page.add_menu_item(__('Download PDF'), async function () {

                try {
                    let response = await fetch(await get_pdf_url());
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

                    let response = await fetch(await get_pdf_url());
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
