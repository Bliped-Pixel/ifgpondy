SELECT ledger_payments.pay_date, ledger.ledgergroup, Sum(ledger_payments.pay_amount) AS creditors_payemnt
FROM ledger INNER JOIN ledger_payments ON (ledger.lgID = ledger_payments.ledger_id) AND (ledger.lgID = ledger_payments.ledger_id)
GROUP BY ledger_payments.pay_date, ledger.ledgergroup
HAVING (((ledger.ledgergroup)=2));

