SELECT Count(sales_ledger_query.SEID) AS CountOfSEID, sales_ledger_query.ledgername, Sum(sales_ledger_query.final_bill) AS sales_amount
FROM sales_ledger_query
GROUP BY sales_ledger_query.ledgername
HAVING (((sales_ledger_query.ledgername)<>"2"));

