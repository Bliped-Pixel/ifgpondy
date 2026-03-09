SELECT Count(sales_entry.SEID) AS CountOfSEID, sales_entry.sales_date, sales_entry.sale_type, Sum(sales_entry.final_bill) AS cash_sale
FROM sales_entry
GROUP BY sales_entry.sales_date, sales_entry.sale_type
HAVING (((sales_entry.sale_type)=1));

