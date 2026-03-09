SELECT ledger.ledgername, order_entry.ODID, order_entry.order_date, order_entry.total_qty, order_entry.total_bill_sft, order_entry.material
FROM ledger INNER JOIN order_entry ON ledger.lgID = order_entry.customer;

