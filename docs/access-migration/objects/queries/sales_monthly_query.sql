SELECT sales_entry.SEID, Format([sales_date],"m") AS [month], sales_entry.customer_id, sales_entry.total_qty AS qty, sales_entry.total_bill_sft AS total_sft, sales_entry.total_bill AS amount, sales_entry.total_tax AS total_tax, sales_entry.labour AS labour, sales_entry.discount AS discount, sales_entry.final_bill AS total_sales
FROM sales_entry;

