SELECT sales_entry.sales_date, Sum(sales_entry.labour) AS labour, Sum(sales_entry.discount) AS discount, Sum(sales_entry.total_tax) AS tax
FROM sales_entry
GROUP BY sales_entry.sales_date;

