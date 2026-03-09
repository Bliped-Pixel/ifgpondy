SELECT item_category.cat_id, item_category.category
FROM item_category
UNION SELECT 0,"All Category" from item_category;

