SELECT item_category.cat_id, items.item_name, items.item_sft, items.opening_stock, [items]![opening_stock]*[item_sft] AS total_sft, materials.mat_pur_price, [total_sft]*[mat_pur_price] AS op_st_value
FROM item_category INNER JOIN (materials INNER JOIN items ON (materials.mat_id = items.material) AND (materials.mat_id = items.material)) ON item_category.cat_id = materials.category_id;

