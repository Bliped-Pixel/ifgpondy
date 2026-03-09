SELECT purchase_entry.PEID, purchase_entry.pur_date, ledger.ledgername, purchase_entry.final_total, purchase_entry.total_bill_sft, purchase_entry.item_cartegory, supplier_balance_query.balance
FROM (ledger LEFT JOIN supplier_balance_query ON ledger.lgID = supplier_balance_query.lgID) INNER JOIN purchase_entry ON ledger.lgID = purchase_entry.sup_id;

