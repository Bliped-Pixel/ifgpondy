SELECT ledger.lgID, ledger.ledgername, Sum(sales_entry.final_bill) AS credit
FROM ledger INNER JOIN sales_entry ON ledger.lgID = sales_entry.customer_id
GROUP BY ledger.lgID, ledger.ledgername;

