import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { QuoteService } from '@core/services/quote.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { NumberFormatService } from '@shared/services/number-format.service';
import { QuoteDetailItem, QuoteItem } from '../../models/quote.model';

export interface PedirResult {
  cotizar: boolean;
  cantidad: number;
  precioTotal: number;
}

@Component({
  selector: 'app-quote-detail-modal',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './quote-detail-modal.component.html'
})
export class QuoteDetailModalComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  @Input() show = false;
  @Input() item: QuoteItem | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<PedirResult>();

  loading = false;
  rows: QuoteDetailItem[] = [];
  icons = { X };

  constructor(
    private quoteService: QuoteService,
    private snackbarService: SnackbarService,
    private numberFormatService: NumberFormatService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']?.currentValue === true && this.item) {
      this.loadDetail();
    }
  }

  getImageUrl(): string {
    return this.item?.imagen || '/images/categories/school.png';
  }

  formatNumber(value: number): string {
    return this.numberFormatService.formatNumber(value);
  }

  formatCurrency(value: number): string {
    return this.numberFormatService.formatCurrency(value);
  }

  close(): void {
    this.closed.emit();
  }

  pedir(): void {
    const selectedRows = this.rows.filter(r => r.cotizar);
    if (selectedRows.length > 0) {
      this.confirmed.emit({
        cotizar: true,
        cantidad: selectedRows.reduce((sum, r) => sum + (r.cantidad ?? 0), 0),
        precioTotal: selectedRows.reduce((sum, r) => sum + (r.precioTotal ?? 0), 0)
      });
    } else {
      this.confirmed.emit({ cotizar: false, cantidad: 0, precioTotal: 0 });
    }
  }

  private loadDetail(): void {
    this.loading = true;
    this.rows = [];

    this.quoteService.getQuoteDetail(this.item!.codigo)
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
        error: (error) => {
          console.error('No se pudo cargar el detalle de la cotizacion.', error);
          this.rows = [];
          this.snackbarService.show('No fue posible cargar el detalle de la cotizacion.', 'error');
        }
      });
  }
}
