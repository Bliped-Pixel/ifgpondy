SELECT total_receipt_query.pay_date, total_receipt_query.amount, total_exp_query.expenses
FROM total_receipt_query LEFT JOIN total_exp_query ON total_receipt_query.pay_date = total_exp_query.pay_date;

