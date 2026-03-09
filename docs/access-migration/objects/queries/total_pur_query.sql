SELECT Count(purchase_entry.PEID) AS CountOfPEID, purchase_entry.pur_date, Sum(purchase_entry.final_total) AS purchase
FROM purchase_entry
GROUP BY purchase_entry.pur_date;

