SELECT contra_entry.deposit_date, Sum(contra_entry.amount) AS contra_amount
FROM contra_entry
GROUP BY contra_entry.deposit_date;

