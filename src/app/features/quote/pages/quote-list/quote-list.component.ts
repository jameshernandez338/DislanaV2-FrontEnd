import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { LucideAngularModule, ChevronRight, CreditCard, PencilRuler, X } from 'lucide-angular';
import { QuoteService } from '@core/services/quote.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { QuoteCustomerBalance, QuoteItem } from '../../models/quote.model';

@Component({
  selector: 'app-quote-list',
  imports: [CommonModule, FormsModule, LucideAngularModule, LoadingSpinnerComponent],
  templateUrl: './quote-list.component.html'
})
export class QuoteListComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  loading = false;
  quoteItems: QuoteItem[] = [];
  customerBalance: QuoteCustomerBalance | null = null;
  showPaymentDrawer = false;
  icons = { PencilRuler, CreditCard, ChevronRight, X };

  constructor(
    private quoteService: QuoteService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadQuotes();
  }

  getImageUrl(item: QuoteItem): string {
    return item.imagen || '/images/categories/school.png';
  }

  get selectedItemsTotal(): number {
    return this.quoteItems
      .filter((item) => item.cotizar)
      .reduce((total, item) => total + (item.precioTotal ?? 0), 0);
  }

  get selectedQuoteItems(): QuoteItem[] {
    return this.quoteItems.filter((item) => item.cotizar);
  }

  get shouldShowCupo(): boolean {
    return this.customerBalance?.usaCupo === true;
  }

  shouldShowDetailAction(item: QuoteItem): boolean {
    return this.normalizeFlag(item.acabado) === 'NO' && this.normalizeFlag(item.linea) === 'SI';
  }

  openDetail(item: QuoteItem) {
    this.snackbarService.show(`Detalle pendiente para ${item.codigo}.`, 'info');
  }

  onCotizarChange(checked: boolean, item: QuoteItem) {
    item.cotizar = checked;

    if (!checked && this.selectedQuoteItems.length === 0) {
      this.showPaymentDrawer = false;
      this.unlockBodyScroll();
    }
  }

  closePaymentDetail() {
    this.showPaymentDrawer = false;
    this.unlockBodyScroll();
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value ?? 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  private loadQuotes() {
    this.loading = true;

    forkJoin({
      quotes: this.quoteService.getQuotes(),
      customerBalance: this.quoteService.getCustomerBalance()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: ({ quotes, customerBalance }) => {
          this.quoteItems = quotes;
          this.customerBalance = customerBalance;
        },
        error: (error) => {
          console.error('No se pudo cargar la lista de cotizacion.', error);
          this.quoteItems = [];
          this.customerBalance = null;
          this.snackbarService.show('No fue posible cargar la lista de cotizacion.', 'error');
        }
      });
  }

  private normalizeFlag(value: string): string {
    return (value || '').trim().toUpperCase();
  }

  openPaymentDetail() {
    if (this.selectedQuoteItems.length === 0) {
      this.snackbarService.show('Debes seleccionar al menos un item para ver el detalle de pago.', 'warning');
      return;
    }

    this.showPaymentDrawer = true;
    this.lockBodyScroll();
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  private lockBodyScroll() {
    this.document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll() {
    this.document.body.style.overflow = '';
  }
}
