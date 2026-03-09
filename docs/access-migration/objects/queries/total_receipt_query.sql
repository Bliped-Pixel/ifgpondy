SELECT Count(ledger_receipt.ID) AS CountOfID, ledger_receipt.pay_date, Sum(ledger_receipt.amount) AS amount
FROM ledger_receipt
GROUP BY ledger_receipt.pay_date;

