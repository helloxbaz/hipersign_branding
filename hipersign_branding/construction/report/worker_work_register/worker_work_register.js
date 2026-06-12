frappe.query_reports["Worker Work Register"] = {

    filters: [
        {
            fieldname: "worker",
            label: "Worker",
            fieldtype: "Link",
            options: "Construction Worker"
        },
        {
            fieldname: "project",
            label: "Project",
            fieldtype: "Link",
            options: "Project"
        },
        {
            fieldname: "from_date",
            label: "From Date",
            fieldtype: "Date"
        },
        {
            fieldname: "to_date",
            label: "To Date",
            fieldtype: "Date"
        }
    ],

    formatter: function(value, row, column, data, default_formatter) {

        value = default_formatter(value, row, column, data);

        // Make worker name clickable
        if (column.fieldname === "worker_name" && data && data.worker) {
            value = `<a href="/app/construction-worker/${data.worker}">
                        ${data.worker_name}
                     </a>`;
        }

        return value;
    }

};
