SELECT ledger_receipt.pay_date, ledger_receipt.ldger_id, Sum(ledger_receipt.amount) AS amount
FROM ledger_receipt
GROUP BY ledger_receipt.pay_date, ledger_receipt.ldger_id
HAVING (((ledger_receipt.ldger_id)<>30));

