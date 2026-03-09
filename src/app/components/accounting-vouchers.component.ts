import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../services/transaction.service';
import { VoucherEntry, VoucherType } from '../models/transaction.model';

@Component({
  selector: 'app-accounting-vouchers',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h2>Receipt / Payment Register</h2>
        <p>Access parity module for <code>receipt_form</code> and <code>payment_form</code>.</p>
      </div>

      <section class="entry-panel">
        <h3>Create Voucher</h3>
        <div class="grid">
          <label>
            Voucher Type
            <select [(ngModel)]="voucherType">
              <option value="receipt">Receipt</option>
              <option value="payment">Payment</option>
              <option value="contra">Contra</option>
            </select>
          </label>

          <label>
            Party Name
            <input type="text" [(ngModel)]="partyName" placeholder="Customer/Supplier/Ledger party" />
          </label>

          <label>
            Ledger
            <input type="text" [(ngModel)]="ledgerName" placeholder="Cash A/C, Bank A/C, Debtors..." />
          </label>

          <label>
            Payment Mode
            <select [(ngModel)]="paymentMode">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </label>

          <label>
            Voucher Date
            <input type="date" [(ngModel)]="voucherDate" />
          </label>

          <label>
            Amount
            <input type="number" [(ngModel)]="amount" min="0" step="0.01" placeholder="0.00" />
          </label>
        </div>

        <label>
          Note
          <textarea [(ngModel)]="note" rows="2" placeholder="Narration / note"></textarea>
        </label>

        <div class="actions">
          <button class="btn btn-primary" (click)="saveVoucher()">Save Voucher</button>
          <button class="btn btn-secondary" (click)="resetForm()">Reset</button>
        </div>
      </section>

      <section class="stats">
        <article>
          <h4>Total Receipts</h4>
          <p>INR {{ getTypeTotal('receipt').toFixed(2) }}</p>
        </article>
        <article>
          <h4>Total Payments</h4>
          <p>INR {{ getTypeTotal('payment').toFixed(2) }}</p>
        </article>
        <article>
          <h4>Total Contra</h4>
          <p>INR {{ getTypeTotal('contra').toFixed(2) }}</p>
        </article>
      </section>

      <section class="table-wrap">
        <h3>Voucher Register</h3>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Type</th>
              <th>Date</th>
              <th>Party</th>
              <th>Ledger</th>
              <th>Mode</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of voucherEntries$()">
              <td>{{ entry.voucherNumber }}</td>
              <td>{{ entry.voucherType | uppercase }}</td>
              <td>{{ entry.voucherDate | date: 'dd/MM/yyyy' }}</td>
              <td>{{ entry.partyName }}</td>
              <td>{{ entry.ledgerName }}</td>
              <td>{{ entry.paymentMode | uppercase }}</td>
              <td>INR {{ entry.amount.toFixed(2) }}</td>
              <td>{{ entry.note || '-' }}</td>
            </tr>
          </tbody>
        </table>

        <p class="empty" *ngIf="voucherEntries$().length === 0">No voucher entries yet.</p>
      </section>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 20px;
      }

      .header h2 {
        margin: 0 0 4px;
      }

      .entry-panel,
      .table-wrap {
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }

      label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
      }

      input,
      select,
      textarea {
        border: 1px solid #cfcfcf;
        border-radius: 8px;
        padding: 8px;
        font: inherit;
      }

      .actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }

      .btn {
        border: none;
        border-radius: 8px;
        padding: 8px 14px;
        cursor: pointer;
      }

      .btn-primary {
        color: #fff;
        background: #17603f;
      }

      .btn-secondary {
        color: #fff;
        background: #667085;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        margin-bottom: 16px;
      }

      .stats article {
        border: 1px solid #d8ead8;
        background: #f3fff4;
        border-radius: 10px;
        padding: 12px;
      }

      .stats h4 {
        margin: 0 0 4px;
        font-size: 13px;
      }

      .stats p {
        margin: 0;
        font-weight: 700;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        border: 1px solid #ececec;
        padding: 8px;
        text-align: left;
      }

      th {
        background: #f8f8f8;
      }

      .empty {
        margin: 10px 0 0;
      }
    `
  ]
})
export class AccountingVouchersComponent {
  voucherEntries$;

  voucherType: VoucherType = 'receipt';
  partyName = '';
  ledgerName = '';
  paymentMode: VoucherEntry['paymentMode'] = 'cash';
  voucherDate = new Date().toISOString().slice(0, 10);
  amount = 0;
  note = '';

  constructor(private transactionService: TransactionService) {
    this.voucherEntries$ = this.transactionService.voucherEntries$;
  }

  saveVoucher(): void {
    const parsedDate = new Date(this.voucherDate);

    const result = this.transactionService.createVoucherEntry(
      this.voucherType,
      this.partyName,
      this.ledgerName,
      this.amount,
      this.paymentMode,
      this.note,
      parsedDate
    );

    if (!result.success) {
      alert(result.message);
      return;
    }

    alert(`Voucher created: ${result.data?.voucherNumber}`);
    this.resetForm();
  }

  resetForm(): void {
    this.voucherType = 'receipt';
    this.partyName = '';
    this.ledgerName = '';
    this.paymentMode = 'cash';
    this.voucherDate = new Date().toISOString().slice(0, 10);
    this.amount = 0;
    this.note = '';
  }

  getTypeTotal(voucherType: VoucherType): number {
    return this.voucherEntries$()
      .filter((entry: VoucherEntry) => entry.voucherType === voucherType)
      .reduce((sum: number, entry: VoucherEntry) => sum + entry.amount, 0);
  }
}
