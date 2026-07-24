import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AccountStatementService } from '@core/services/account-statement.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { NumberFormatService } from '@shared/services/number-format.service';
import { AccountStatementItem } from '../../models/account-statement.model';

@Component({
  selector: 'app-account-statement',
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './account-statement.component.html'
})
export class AccountStatementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  items: AccountStatementItem[] = [];
  documentTypeFilter = '';

  readonly documentTypeOptions = [
    'FACTURA DE VENTA',
    'NOTA CRÉDITO',
    'NOTA DEBITO',
    'RECIBO DE PAGO'
  ];

  startDate: string;
  endDate: string;

  constructor(
    private accountStatementService: AccountStatementService,
    private snackbarService: SnackbarService,
    private numberFormatService: NumberFormatService
  ) {
    const now = new Date();
    this.startDate = `${now.getFullYear()}-01-01`;
    this.endDate = this.toInputDate(now);
  }

  ngOnInit(): void {
    this.loadStatement();
  }

  onSearch(): void {
    this.loadStatement();
  }

  formatDate(value: string): string {
    return this.numberFormatService.formatDate(value);
  }

  formatCurrency(value: number): string {
    return this.numberFormatService.formatCurrency(value);
  }

  private toInputDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private loadStatement(): void {
    this.loading = true;

    const start = new Date(this.startDate + 'T00:00:00');
    const end = new Date(this.endDate + 'T23:59:59');

    this.accountStatementService.getAccountStatement(start, end, this.documentTypeFilter || undefined)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: (data) => { this.items = data; },
        error: (err) => {
          console.error('Error loading account statement', err);
          this.items = [];
          this.snackbarService.show('No fue posible cargar el extracto de cartera.', 'error');
        }
      });
  }
}
