SELECT total_sales_query.sales_date, cash_sales_query.cash_sale, credit_sales_query.credit_sale, total_sales_query.sales_amount
FROM (cash_sales_query RIGHT JOIN total_sales_query ON cash_sales_query.sales_date = total_sales_query.sales_date) LEFT JOIN credit_sales_query ON total_sales_query.sales_date = credit_sales_query.sales_date;

