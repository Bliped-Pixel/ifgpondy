SELECT sales_entry.sales_date, items.item_id, items.item_name, sales_detail.qty, sales_detail.total_sft, materials.mat_id
FROM sales_entry INNER JOIN ((materials INNER JOIN items ON (materials.mat_id = items.material) AND (materials.mat_id = items.material)) INNER JOIN sales_detail ON items.item_id = sales_detail.item_id) ON sales_entry.SEID = sales_detail.SEID
ORDER BY sales_entry.sales_date;

