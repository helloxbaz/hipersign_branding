# Copyright (c) 2026, Hipersign Technologies and contributors
# For license information, please see license.txt

# import frappe
# Copyright (c) 2026, Hipersign Technologies
# For license information, please see license.txt

import frappe

def execute(filters=None):
    filters = filters or {}

    columns = [
        {"label": "Date", "fieldname": "date", "fieldtype": "Date", "width": 100},

        # Hidden ID column (needed for click navigation)
        {
            "label": "Worker ID",
            "fieldname": "worker",
            "fieldtype": "Link",
            "options": "Construction Worker",
            "hidden": 1
        },

        # Visible Worker Name
        {
            "label": "Worker",
            "fieldname": "worker_name",
            "fieldtype": "Data",
            "width": 150
        },

        {
            "label": "Project",
            "fieldname": "project",
            "fieldtype": "Link",
            "options": "Project",
            "width": 120
        },

        {"label": "Days", "fieldname": "qty", "fieldtype": "Float", "width": 80},
        {"label": "Rate", "fieldname": "rate", "fieldtype": "Currency", "width": 100},
        {"label": "Amount", "fieldname": "amount", "fieldtype": "Currency", "width": 120},
        {"label": "Paid Amount", "fieldname": "paid_amount", "fieldtype": "Currency", "width": 120},
        {"label": "Balance", "fieldname": "balance", "fieldtype": "Currency", "width": 120},
    ]

    conditions = ""

    if filters.get("worker"):
        conditions += " AND l.worker = %(worker)s"

    if filters.get("project"):
        conditions += " AND d.project = %(project)s"

    if filters.get("from_date"):
        conditions += " AND d.date >= %(from_date)s"

    if filters.get("to_date"):
        conditions += " AND d.date <= %(to_date)s"

    data = frappe.db.sql(f"""
        SELECT
            d.date,
            w.name AS worker,
            w.name1 AS worker_name,
            d.project,
            l.qty,
            l.rate,
            l.amount,

            IFNULL(SUM(
                CASE 
                    WHEN gl.voucher_type = 'Payment Entry'
                    THEN gl.debit
                    ELSE 0
                END
            ), 0) AS paid_amount,

            (l.amount - IFNULL(SUM(
                CASE 
                    WHEN gl.voucher_type = 'Payment Entry'
                    THEN gl.debit
                    ELSE 0
                END
            ), 0)) AS balance

        FROM `tabDaily Labour Sheet` d

        INNER JOIN `tabDaily Labour Line` l
            ON l.parent = d.name

        LEFT JOIN `tabConstruction Worker` w
            ON w.name = l.worker

        LEFT JOIN `tabGL Entry` gl
            ON gl.party = w.employee
            AND gl.party_type = 'Employee'
            AND gl.account = w.labour_payable_account
            AND gl.is_cancelled = 0

        WHERE d.docstatus = 1
        {conditions}

        GROUP BY
            d.date,
            w.name,
            w.name1,
            d.project,
            l.qty,
            l.rate,
            l.amount

        ORDER BY d.date DESC
    """, filters, as_dict=1)

    return columns, data
