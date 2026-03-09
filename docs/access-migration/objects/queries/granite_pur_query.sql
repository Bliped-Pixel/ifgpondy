SELECT purchase_entry.pur_date, Sum(purchase_detail.amount) AS granite, item_category.cat_id
FROM purchase_entry INNER JOIN ((item_category INNER JOIN (materials INNER JOIN items ON (materials.mat_id = items.material) AND (materials.mat_id = items.material)) ON item_category.cat_id = materials.category_id) INNER JOIN purchase_detail ON items.item_id = purchase_detail.item_id) ON purchase_entry.PEID = purchase_detail.PEID
GROUP BY purchase_entry.pur_date, item_category.cat_id
HAVING (((item_category.cat_id)=2));

