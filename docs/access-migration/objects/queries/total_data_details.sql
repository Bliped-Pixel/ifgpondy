SELECT ledger.lgID, ledger.ledgername, ledgers_sales_query.sales_date AS Expr1, ledgers_sales_query.credit, exp_list_query.pay_amount, contra_entry.amount
FROM ((ledger LEFT JOIN exp_list_query ON ledger.lgID = exp_list_query.lgID) LEFT JOIN contra_entry ON ledger.lgID = contra_entry.ledger) INNER JOIN ledgers_sales_query ON ledger.lgID = ledgers_sales_query.lgID;

