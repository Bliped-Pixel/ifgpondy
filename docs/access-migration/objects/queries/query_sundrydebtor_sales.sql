SELECT ledger.ledgergroup, Sum(ledgers_sales_query.debit) AS debtors_amount
FROM ledger INNER JOIN ledgers_sales_query ON ledger.lgID = ledgers_sales_query.lgID
GROUP BY ledger.ledgergroup
HAVING (((ledger.ledgergroup)=3));

