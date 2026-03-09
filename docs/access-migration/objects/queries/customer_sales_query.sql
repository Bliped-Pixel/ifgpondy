SELECT sales_entry.SEID, sales_entry.sales_date, ledger.ledgername, sales_entry.customer_id, ledger.GSTNo, sales_entry.sale_type, sales_entry.final_bill, sales_entry.total_bill, sales_entry.total_tax, sales_entry.labour, sales_entry.discount, sales_entry.total_qty, sales_entry.total_bill_sft, sales_entry.item_category, sales_entry.customer_id AS search
FROM ledger INNER JOIN sales_entry ON ledger.lgID = sales_entry.customer_id
ORDER BY sales_entry.SEID, sales_entry.sales_date;

