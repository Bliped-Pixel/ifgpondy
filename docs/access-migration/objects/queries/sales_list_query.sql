SELECT sales_entry.SEID, sales_entry.sales_date, sales_entry.customer_id, sales_entry.tax_type, sales_entry.sale_type, sales_entry.final_bill, sales_entry.total_bill, sales_entry.total_tax, sales_entry.labour, sales_entry.discount, sales_entry.total_qty, sales_entry.total_bill_sft, item_category.category, [SEID] & [ledgername] & [sale_type]![sale_type] & [category] AS Search
FROM item_category INNER JOIN (sale_type INNER JOIN (sale_tax_type INNER JOIN (ledger INNER JOIN sales_entry ON ledger.lgID = sales_entry.customer_id) ON sale_tax_type.sale_txtype_ID = sales_entry.tax_type) ON sale_type.saletype_ID = sales_entry.sale_type) ON item_category.cat_id = sales_entry.item_category
ORDER BY sales_entry.SEID, sales_entry.final_bill;

