SELECT ledger_payments.pay_date, ledger_payments.pay_amount AS bank_exp
FROM ledger_payments
WHERE (((ledger_payments.pay_mode)=2));

