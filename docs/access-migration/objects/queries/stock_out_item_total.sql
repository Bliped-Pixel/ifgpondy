SELECT stock_out.item_id, stock_out.item_name, Sum(stock_out.st_out_qty) AS st_out_qty
FROM stock_out
GROUP BY stock_out.item_id, stock_out.item_name;

