SELECT ledger.lgID, ledger.ledgername, ledger.ledgergroup, ledgers_purchase_query.credit, ledgers_payment_query.debit, Nz([debit],0)-Nz([credit],0) AS balance
FROM (ledger LEFT JOIN ledgers_purchase_query ON ledger.lgID = ledgers_purchase_query.lgID) LEFT JOIN ledgers_payment_query ON ledger.lgID = ledgers_payment_query.lgID
WHERE (((ledger.ledgergroup)=2));

