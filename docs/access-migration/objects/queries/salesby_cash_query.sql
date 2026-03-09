SELECT ledger_receipt.pay_date, ledger_receipt.pay_mode, Sum(ledger_receipt.amount) AS cash
FROM ledger_receipt
GROUP BY ledger_receipt.pay_date, ledger_receipt.pay_mode
HAVING (((ledger_receipt.pay_mode)=1));

