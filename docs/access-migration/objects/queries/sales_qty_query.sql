SELECT sales_detail.item_id, Sum(sales_detail.qty) AS sales_qty
FROM sales_detail
GROUP BY sales_detail.item_id;

