SELECT stock_in.item_id, stock_in.item_name, Sum(stock_in.st_in_qty) AS st_in_qty
FROM stock_in
GROUP BY stock_in.item_id, stock_in.item_name;

