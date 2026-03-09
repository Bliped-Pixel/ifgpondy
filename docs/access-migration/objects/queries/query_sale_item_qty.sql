SELECT sales_detail.item_id, Sum(sales_detail.qty) AS saleqty
FROM sales_detail
GROUP BY sales_detail.item_id;

