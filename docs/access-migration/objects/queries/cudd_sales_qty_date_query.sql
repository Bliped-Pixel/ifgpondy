SELECT sales_entry.sales_date, sales_detail.item_id, Sum(sales_detail.qty) AS qty, item_category.cat_id, item_category.category, items.item_sft, [qty]*[items]![item_sft] AS total_sft
FROM sales_entry INNER JOIN ((item_category INNER JOIN (materials INNER JOIN items ON (materials.mat_id = items.material) AND (materials.mat_id = items.material)) ON item_category.cat_id = materials.category_id) INNER JOIN sales_detail ON items.item_id = sales_detail.item_id) ON sales_entry.SEID = sales_detail.SEID
GROUP BY sales_entry.sales_date, sales_detail.item_id, item_category.cat_id, item_category.category, items.item_sft, [qty]*[items]![item_sft]
HAVING (((item_category.cat_id)=1));

