SELECT sales_entry.sales_date, ledger.ledgergroup, Sum(sales_entry.final_bill) AS cash
FROM ledger INNER JOIN sales_entry ON ledger.lgID = sales_entry.customer_id
GROUP BY sales_entry.sales_date, ledger.ledgergroup
HAVING (((ledger.ledgergroup)=4));

