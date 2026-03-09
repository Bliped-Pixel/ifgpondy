# Access App Extraction (Ready for Porting)

Source database used:
- `BackupDB-28-02-2026 (1).accdb`

## Extraction summary
- Tables: 36
- Queries: 82
- Forms: 62
- Reports: 17
- VBA Modules: 5

## Generated files
- `docs/access-migration/access-summary.json` (full inventory)
- `docs/access-migration/objects/forms/*.txt` (62 exported form definitions)
- `docs/access-migration/objects/reports/*.txt` (17 exported report definitions)
- `docs/access-migration/objects/modules/*.txt` (5 VBA module exports)
- `docs/access-migration/objects/queries/*.sql` (82 query SQL files)

## Notable migrated business logic identified
- `globals.useraccess(button_name)` role-based permission lookup via `employeeaccess`
- `item_check.balcheck(item_id)` item balance lookup from `item_bal_query`
- `Module1.SpellNumber(amt)` Indian currency number-to-words conversion

## Porting phases (implementation order)
1. Data model parity (tables + relations + lookup data)
2. Auth/access parity (employee access matrix)
3. Transaction modules (sales, purchase, receipt, payment, contra)
4. Inventory/stock parity (stock in/out, item balance checks)
5. Accounting parity (ledger, trial balance, P&L, balance sheet)
6. Report parity (sales bill, quotation, monthly reports)
7. UAT: side-by-side behavior validation with Access outputs

## Immediate next build step
Start with **Phase 1 + Phase 2** in the current app:
- Add missing entities from Access tables into app models/services.
- Implement role-based access checks using `employeeaccess` style rules.
