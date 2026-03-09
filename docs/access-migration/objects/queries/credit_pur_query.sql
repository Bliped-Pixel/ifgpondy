SELECT ledger.lgID, ledger.ledgername, purchase_entry.final_total, purchase_entry.pur_date
FROM ledger INNER JOIN purchase_entry ON ledger.lgID = purchase_entry.sup_id;

