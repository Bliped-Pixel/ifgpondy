SELECT Count(sales_entry.SEID) AS CountOfSEID, sales_entry.sales_date, Sum(sales_entry.final_bill) AS sales_amount
FROM sales_entry
GROUP BY sales_entry.sales_date;

