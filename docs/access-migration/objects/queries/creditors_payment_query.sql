SELECT ledger.lgID, ledger.ledgername, ledger_payments.pay_amount, ledger_payments.pay_date, ledgergroup.lggID
FROM (ledgergroup INNER JOIN ledger ON ledgergroup.lggID = ledger.ledgergroup) INNER JOIN ledger_payments ON (ledger.lgID = ledger_payments.ledger_id) AND (ledger.lgID = ledger_payments.ledger_id)
WHERE (((ledgergroup.lggID)=2));

