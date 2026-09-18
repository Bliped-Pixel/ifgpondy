import { TestBed } from '@angular/core/testing';
import { InvoiceItem } from '../models/invoice.model';
import { TransactionItem } from '../models/transaction.model';
import { BillingService } from './billing.service';
import { InventoryService } from './inventory.service';
import { TransactionService } from './transaction.service';

describe('Invoice, sales and stock integration', () => {
  let billingService: BillingService;
  let inventoryService: InventoryService;
  let transactionService: TransactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    billingService = TestBed.inject(BillingService);
    inventoryService = TestBed.inject(InventoryService);
    transactionService = TestBed.inject(TransactionService);
  });

  it('creates sales from invoices and restores stock when an invoice is deleted', () => {
    const startingQuantity = getSizeQuantity('1', '2x2');
    const item: InvoiceItem = {
      id: 'invoice-line-1',
      stoneId: '1',
      stoneName: 'Black Granite',
      stoneType: 'Granite',
      size: '2x2',
      quantity: 2,
      unit: 'pieces',
      squareFeet: 8,
      pricePerUnit: 500,
      gstPercentage: 18,
      gstAmount: 720,
      totalAmount: 4000
    };

    const invoice = billingService.createInvoice('Test Customer', [item], 0, '', 'credit');

    expect(getSizeQuantity('1', '2x2')).toBe(startingQuantity - 2);
    expect(transactionService.salesEntries$()).toHaveLength(1);
    expect(transactionService.salesEntries$()[0].billNumber).toBe(invoice.invoiceNumber);
    expect(transactionService.salesEntries$()[0].billType).toBe('credit');

    billingService.updateInvoiceStatus(invoice.id, 'paid');
    expect(transactionService.salesEntries$()[0].paymentStatus).toBe('paid');

    expect(billingService.deleteInvoice(invoice.id)).toBe(true);
    expect(getSizeQuantity('1', '2x2')).toBe(startingQuantity);
    expect(transactionService.salesEntries$()).toHaveLength(0);
  });

  it('rolls back every item when a batch stock mutation fails', () => {
    const startingQuantity = getSizeQuantity('1', '2x2');
    const result = inventoryService.consumeStockBatch([
      { stoneId: '1', size: '2x2', quantity: 1 },
      { stoneId: 'missing-stone', size: '2x2', quantity: 1 }
    ]);

    expect(result.success).toBe(false);
    expect(getSizeQuantity('1', '2x2')).toBe(startingQuantity);
  });

  it('supports stock-only corrections and supplier-backed purchase refills', () => {
    const startingQuantity = getSizeQuantity('1', '2x2');
    const minorItem = createPurchaseItem('minor-refill', 3, 0);
    const minorResult = transactionService.applyStockRefill([minorItem]);

    expect(minorResult.success).toBe(true);
    expect(transactionService.purchaseEntries$()).toHaveLength(0);
    expect(getSizeQuantity('1', '2x2')).toBe(startingQuantity + 3);

    const purchaseItem = createPurchaseItem('major-refill', 10, 300);
    const purchaseResult = transactionService.createPurchaseEntry('Test Supplier', [purchaseItem]);

    expect(purchaseResult.success).toBe(true);
    expect(transactionService.purchaseEntries$()).toHaveLength(1);
    expect(transactionService.purchaseEntries$()[0].supplierName).toBe('Test Supplier');
    expect(getSizeQuantity('1', '2x2')).toBe(startingQuantity + 13);
  });

  it('renders a safe A4 invoice using the supplied IFG letterhead', () => {
    const item: InvoiceItem = {
      id: 'print-line-1',
      stoneId: '1',
      stoneName: 'Black & Gold Granite',
      stoneType: 'Granite',
      size: '2x2',
      quantity: 1,
      unit: 'pieces',
      squareFeet: 4,
      pricePerUnit: 500,
      gstPercentage: 18,
      gstAmount: 360,
      totalAmount: 2000
    };
    const invoice = billingService.createInvoice('Stone & Son <Pondy>', [item]);
    const printableInvoice = billingService.exportInvoiceAsHtml(invoice);

    expect(printableInvoice).toContain('@page { size: A4 portrait;');
    expect(printableInvoice).toContain('brand/ifg-letterhead.jpeg');
    expect(printableInvoice).toContain('Stone &amp; Son &lt;Pondy&gt;');
    expect(printableInvoice).toContain('Black &amp; Gold Granite');
    expect(printableInvoice).not.toContain('<script>');
  });

  function getSizeQuantity(stoneId: string, dimension: string): number {
    return (
      inventoryService
        .getStone(stoneId)
        ?.sizes.find(size => size.dimension.toLowerCase() === dimension.toLowerCase())?.quantity ?? 0
    );
  }

  function createPurchaseItem(id: string, quantity: number, rate: number): TransactionItem {
    const squareFeet = quantity * 4;
    const amount = squareFeet * rate;
    const gstAmount = amount * 0.18;

    return {
      id,
      stoneId: '1',
      stoneName: 'Black Granite',
      stoneType: 'Granite',
      size: '2x2',
      quantity,
      squareFeet,
      ratePerSqFt: rate,
      amount,
      gstPercentage: 18,
      gstAmount,
      lineTotal: amount + gstAmount
    };
  }
});
