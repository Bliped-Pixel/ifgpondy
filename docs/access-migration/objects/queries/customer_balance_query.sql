SELECT ledger.lgID, ledger.ledgername, ledger.contactnumber, ledgers_sales_query.credit, ledgers_payment_query.debit, Nz([credit],0)-Nz([debit],0) AS balance, [ledger]![ledgername] & [contactnumber] AS search
FROM (ledgers_sales_query LEFT JOIN ledger ON ledgers_sales_query.lgID = ledger.lgID) LEFT JOIN ledgers_payment_query ON ledger.lgID = ledgers_payment_query.lgID
WHERE (((ledger.ledgergroup)=(2) Or (ledger.ledgergroup)=(3) Or (ledger.ledgergroup)=(4)));

