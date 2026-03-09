SELECT Count(purchase_entry.PEID) AS CountOfPEID, purchase_entry.pur_date, Sum(purchase_entry.final_total) AS cash_pur, purchase_entry.pur_type
FROM purchase_entry
GROUP BY purchase_entry.pur_date, purchase_entry.pur_type
HAVING (((purchase_entry.pur_type)=1));

