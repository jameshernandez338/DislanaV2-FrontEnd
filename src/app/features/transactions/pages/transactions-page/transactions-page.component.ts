import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideAngularModule, Printer, ReceiptText } from 'lucide-angular';
import { SnackbarService } from '@core/services/snackbar.service';
import { TransactionService } from '@core/services/transaction.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { NumberFormatService } from '@shared/services/number-format.service';
import { TransactionItem } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions-page',
  imports: [CommonModule, LucideAngularModule, LoadingSpinnerComponent],
  templateUrl: './transactions-page.component.html'
})
export class TransactionsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  transactions: TransactionItem[] = [];

  readonly icons = {
    invoice: ReceiptText,
    receipt: Printer
  };

  constructor(
    private transactionService: TransactionService,
    private snackbarService: SnackbarService,
    private numberFormatService: NumberFormatService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  formatDate(value: string): string {
    return this.numberFormatService.formatDate(value);
  }

  formatCurrency(value: number): string {
    return this.numberFormatService.formatCurrency(value);
  }

  canPrintInvoice(transaction: TransactionItem): boolean {
    return this.hasLink(transaction.linkInvoice);
  }

  canPrintReceipt(transaction: TransactionItem): boolean {
    return this.hasLink(transaction.linkDian);
  }

  printInvoice(transaction: TransactionItem) {
    if (!this.canPrintInvoice(transaction)) {
      return;
    }

    this.snackbarService.show(
      `Imprimir factura - ${transaction.number}.`,
      'info'
    );

    window.open(transaction.linkInvoice, '_blank', 'noopener,noreferrer');
  }

  printReceipt(transaction: TransactionItem) {
    if (!this.canPrintReceipt(transaction)) {
      return;
    }

    this.snackbarService.show(
      `Imprimir recibo - ${transaction.number}.`,
      'info'
    );

    window.open(transaction.linkDian, '_blank', 'noopener,noreferrer');
  }

  private hasLink(value: string | null | undefined): boolean {
    return typeof value === 'string' && value.trim() !== '';
  }

  private loadTransactions() {
    this.loading = true;

    this.transactionService.getTransactions()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
        },
        error: (error) => {
          console.error('No se pudo cargar la lista de movimientos.', error);
          this.transactions = [];
          this.snackbarService.show('No fue posible cargar la lista de movimientos.', 'error');
        }
      });
  }
}
