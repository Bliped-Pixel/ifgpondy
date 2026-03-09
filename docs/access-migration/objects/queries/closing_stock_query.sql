SELECT item_category.cat_id, item_category.category, Sum(items_list_query.st_value) AS closing
FROM item_category LEFT JOIN items_list_query ON item_category.category = items_list_query.category
GROUP BY item_category.cat_id, item_category.category;

