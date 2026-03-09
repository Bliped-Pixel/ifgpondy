SELECT items.item_id, items.item_name, items.item_sft, materials.mat_tax, materials.mat_pur_price, materials.material_name, items.itemcode, items.unit, materials.mat_sale_price, item_category.category, items.discontinue, materials.mat_id, item_bal_query.balance_qty, Nz([balance_qty],0)*Nz([items]![item_sft],0) AS st_sft, items.material, Nz([st_sft],0)*Nz([materials]![mat_pur_price],0) AS st_value
FROM units INNER JOIN (item_category INNER JOIN (materials INNER JOIN (items LEFT JOIN item_bal_query ON items.item_id = item_bal_query.item_id) ON (materials.mat_id = items.material) AND (materials.mat_id = items.material)) ON item_category.cat_id = materials.category_id) ON units.unit_ID = materials.unit
ORDER BY items.item_name;

