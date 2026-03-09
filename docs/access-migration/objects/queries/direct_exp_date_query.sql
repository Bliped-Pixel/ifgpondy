SELECT ledger_payments.ledger_id, ledger_payments.pay_amount, ledgergroup.lggID, ledger_payments.pay_date
FROM (ledgergroup INNER JOIN ledger ON ledgergroup.lggID = ledger.ledgergroup) INNER JOIN ledger_payments ON (ledger.lgID = ledger_payments.ledger_id) AND (ledger.lgID = ledger_payments.ledger_id)
WHERE (((ledgergroup.lggID)=7));

