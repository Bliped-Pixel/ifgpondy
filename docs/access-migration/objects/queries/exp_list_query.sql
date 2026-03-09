SELECT ledger_payments.pay_ID, ledger.lgID, ledger.ledgername, ledger_payments.pay_date, ledger_payments.pay_mode, ledger_payments.pay_amount, ledger_payments.remarks
FROM ledger INNER JOIN ledger_payments ON (ledger.lgID = ledger_payments.ledger_id) AND (ledger.lgID = ledger_payments.ledger_id)
ORDER BY ledger_payments.pay_ID, ledger_payments.pay_date;

