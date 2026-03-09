SELECT total_sales_query.sales_date, total_sales_query.sales_amount, total_exp_query.expenses, Nz([sales_amount],0)-Nz([expenses],0) AS balance
FROM total_exp_query RIGHT JOIN total_sales_query ON total_exp_query.pay_date = total_sales_query.sales_date;

