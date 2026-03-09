SELECT purchase_detail.item_id, Sum(purchase_detail.qty) AS purqty
FROM purchase_detail
GROUP BY purchase_detail.item_id;

