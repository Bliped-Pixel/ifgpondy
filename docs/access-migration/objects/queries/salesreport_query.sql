SELECT sales_entry.SEID, sales_entry.customer_id, ledger.GSTNo, sales_entry.sales_date, sales_entry.tax_type, sales_entry.final_bill, sales_entry.total_bill, sales_entry.outputsgst, sales_entry.outputcgst, sales_entry.outputigst, sales_entry.labour, sales_entry.discount, sales_entry.total_bill_sft, sales_entry.item_category
FROM sale_tax_type INNER JOIN (ledger INNER JOIN (item_category RIGHT JOIN sales_entry ON item_category.cat_id = sales_entry.item_category) ON ledger.lgID = sales_entry.customer_id) ON sale_tax_type.sale_txtype_ID = sales_entry.tax_type
ORDER BY sales_entry.SEID, sales_entry.sales_date;

