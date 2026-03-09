SELECT ledger.lgID, ledger_receipt.ldger_id, ledger.ledgername, Sum(ledger_receipt.amount) AS debit
FROM ledger LEFT JOIN ledger_receipt ON ledger.lgID = ledger_receipt.ldger_id
GROUP BY ledger.lgID, ledger_receipt.ldger_id, ledger.ledgername;

