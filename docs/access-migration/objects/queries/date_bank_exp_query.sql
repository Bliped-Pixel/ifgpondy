SELECT ledger_payments.pay_date, Sum(ledger_payments.pay_amount) AS bank_exp
FROM ledger_payments
GROUP BY ledger_payments.pay_date, ledger_payments.pay_mode
HAVING (((ledger_payments.pay_mode)=2));

