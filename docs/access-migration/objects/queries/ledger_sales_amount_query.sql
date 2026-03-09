SELECT sales_entry.sales_date, sales_entry.customer_id, Sum(sales_entry.final_bill) AS final_bill
FROM sales_entry
GROUP BY sales_entry.sales_date, sales_entry.customer_id;

