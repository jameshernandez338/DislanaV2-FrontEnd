import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';
import { AppDatePipe } from '@shared/pipes/app-date.pipe';
import { QuoteService } from '@core/services/quote.service';
import { QuoteCustomerBalanceDetail } from '../../models/quote.model';

type BalanceType = 'cartera' | 'apin' | 'saldoAFavor';

const TITLE_MAP: Record<BalanceType, string> = {
  cartera: 'Cartera Vencida',
  apin: 'APIN',
  saldoAFavor: 'Saldo a Favor'
};

@Component({
  selector: 'app-balance-detail-modal',
  imports: [NgClass, LucideAngularModule, AppDatePipe, AppCurrencyPipe],
  templateUrl: './balance-detail-modal.component.html'
})
export class BalanceDetailModalComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  @Input() show = false;
  @Input() type: BalanceType = 'cartera';
  @Output() closed = new EventEmitter<void>();

  loading = false;
  loadFailed = false;
  rows: QuoteCustomerBalanceDetail[] = [];
  icons = { X };

  constructor(private quoteService: QuoteService) {}

  get title(): string {
    return TITLE_MAP[this.type];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']?.currentValue === true) {
      this.loadDetail();
    }
  }

  close(): void {
    this.closed.emit();
  }

  private loadDetail(): void {
    this.loading = true;
    this.loadFailed = false;
    this.rows = [];

    this.quoteService.getCustomerBalance(this.type)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (rows) => {
          this.rows = rows;
        },
        error: () => {
          this.loadFailed = true;
        }
      });
  }
}
