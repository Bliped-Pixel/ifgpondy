SELECT ledger.lgID, ledger.ledgername, ledger.ledgergroup, ledger_receipt.pay_date, ledger_receipt.amount
FROM ledger LEFT JOIN ledger_receipt ON ledger.lgID = ledger_receipt.ldger_id
WHERE (((ledger.ledgergroup)=11));

