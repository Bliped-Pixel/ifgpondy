SELECT sales_exp_rb.pay_date, sales_exp_rb.amount, sales_exp_rb.expenses, (Select Sum(nz([amount],0)-nz([expenses],0))From date_sale_exp_query Where date_sale_exp_query.pay_date<=sales_exp_rb.pay_date) AS balance
FROM date_sale_exp_query AS sales_exp_rb
ORDER BY sales_exp_rb.pay_date;

