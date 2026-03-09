SELECT ledgergroup.lggID, ledger.ledgername, ledger.opening_balance
FROM ledgergroup INNER JOIN ledger ON ledgergroup.lggID = ledger.ledgergroup
WHERE (((ledgergroup.lggID)=2));

