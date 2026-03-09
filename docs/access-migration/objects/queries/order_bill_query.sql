SELECT order_entry.ODID, order_entry.order_date, order_entry.customer, order_entry.total_qty, order_entry.total_bill_sft, items.item_name, order_detail.qty, items.unit, ledger.lgID, ledger.ledgername, ledger.contactnumber, ledger.contactaddress, ledger.city, ledger.state, ledger.GSTNo, order_detail.total_sft
FROM (ledger INNER JOIN order_entry ON ledger.lgID = order_entry.customer) INNER JOIN (items INNER JOIN order_detail ON items.item_id = order_detail.item_id) ON order_entry.ODID = order_detail.ODID;

