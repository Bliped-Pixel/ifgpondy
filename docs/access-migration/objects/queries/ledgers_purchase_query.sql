SELECT purchase_entry.pur_date, ledger.lgID, ledger.ledgername, Sum(purchase_entry.final_total) AS credit
FROM ledger INNER JOIN purchase_entry ON ledger.lgID = purchase_entry.sup_id
GROUP BY purchase_entry.pur_date, ledger.lgID, ledger.ledgername;

