SELECT ledger_receipt.pay_date, ledger_receipt.pay_mode, ledger_receipt.amount
FROM ledger_receipt
WHERE (((ledger_receipt.pay_mode)=1));

