SELECT ledger.ledgername, Sum(ledger_payments.pay_amount) AS total_exp
FROM (ledgergroup INNER JOIN ledger ON ledgergroup.lggID = ledger.ledgergroup) INNER JOIN ledger_payments ON (ledger.lgID = ledger_payments.ledger_id) AND (ledger.lgID = ledger_payments.ledger_id)
GROUP BY ledger.ledgername, ledgergroup.lggID
HAVING (((ledgergroup.lggID)=6));

