SELECT quotation_entry.customer_id, quotation_entry.QEID, quotation_entry.quot_date, quotation_entry.item_category, quotation_entry.final_bill, quotation_entry.total_bill, quotation_entry.total_tax, quotation_entry.labour, quotation_entry.discount
FROM ledger INNER JOIN quotation_entry ON ledger.lgID = quotation_entry.customer_id;

