SELECT ledger.lgID, ledger.ledgername, ledger.ledgergroup, ledgers_sales_query.credit, ledgers_payment_query.debit, Nz([credit],0)-Nz([debit],0) AS balance
FROM (ledgers_sales_query RIGHT JOIN ledger ON ledgers_sales_query.lgID = ledger.lgID) LEFT JOIN ledgers_payment_query ON ledger.lgID = ledgers_payment_query.lgID
WHERE (((ledger.ledgergroup)=3));

