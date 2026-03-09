SELECT purchase_detail.item_id, Sum(purchase_detail.qty) AS pur_qty
FROM purchase_entry INNER JOIN purchase_detail ON purchase_entry.PEID = purchase_detail.PEID
GROUP BY purchase_detail.item_id;

