SELECT Count(ledger_payments.pay_ID) AS CountOfpay_ID, ledger_payments.pay_date, Sum(ledger_payments.pay_amount) AS expenses
FROM ledger_payments
GROUP BY ledger_payments.pay_date;

