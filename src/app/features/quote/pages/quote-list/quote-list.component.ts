import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { LucideAngularModule, ChevronRight, CircleAlert, CreditCard, PencilRuler, Printer, SquareMinus, X } from 'lucide-angular';
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

  @ViewChild('abonoAmountInput')
  set abonoAmountInputRef(input: ElementRef<HTMLInputElement> | undefined) {
    if (!input || !this.isEditingAbono) {
      return;
    }

    queueMicrotask(() => {
      input.nativeElement.focus();
      input.nativeElement.select();
    });
  }

  loading = false;
  quoteItems: QuoteItem[] = [];
  customerBalance: QuoteCustomerBalance | null = null;
  showPaymentDrawer = false;
  applyReteIca = true;
  applyAbono = false;
  abonoAmount = 0;
  abonoInput = '';
  isEditingAbono = false;
  icons = { PencilRuler, CreditCard, ChevronRight, CircleAlert, Printer, SquareMinus, X };

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

  get subtotalToPay(): number {
    return this.selectedItemsTotal;
  }

  get discountToPay(): number {
    return this.customerBalance?.descuento ?? 0;
  }

  get ivaToPay(): number {
    return this.customerBalance?.iva ?? 0;
  }

  get reteFuenteToPay(): number {
    return this.customerBalance?.reteFuente ?? 0;
  }

  get reteIvaToPay(): number {
    return this.customerBalance?.reteIva ?? 0;
  }

  get reteIcaToPay(): number {
    if (!this.applyReteIca) {
      return 0;
    }

    return this.customerBalance?.reteIca ?? 0;
  }

  get carteraToPay(): number {
    return this.customerBalance?.cartera ?? 0;
  }

  get apinToPay(): number {
    return this.customerBalance?.apin ?? 0;
  }

  get saldoAFavorToPay(): number {
    return this.customerBalance?.saldoAFavor ?? 0;
  }

  get abonoToPay(): number {
    if (!this.applyAbono) {
      return 0;
    }

    return this.abonoAmount;
  }

  get totalToPay(): number {
    return this.subtotalToPay
      - this.discountToPay
      + this.ivaToPay
      - this.reteFuenteToPay
      - this.reteIvaToPay
      - this.reteIcaToPay
      + this.carteraToPay
      + this.apinToPay
      - this.saldoAFavorToPay
      + this.abonoToPay;
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

    this.applyReteIca = (this.customerBalance?.reteIca ?? 0) > 0;
    this.applyAbono = false;
    this.abonoAmount = 0;
    this.abonoInput = '';
    this.isEditingAbono = false;
    this.showPaymentDrawer = true;
    this.lockBodyScroll();
  }

  onApplyAbonoChange(checked: boolean) {
    this.applyAbono = checked;

    if (checked) {
      this.abonoInput = this.formatNumber(this.abonoAmount);
      this.isEditingAbono = true;
      return;
    }

    this.abonoAmount = 0;
    this.abonoInput = '';
    this.isEditingAbono = false;
  }

  onAbonoInputChange(value: string) {
    const digitsOnly = (value ?? '').replace(/\D/g, '');

    if (!digitsOnly) {
      this.abonoAmount = 0;
      this.abonoInput = '';
      return;
    }

    this.abonoAmount = Number(digitsOnly);
    this.abonoInput = this.formatNumber(this.abonoAmount);
  }

  commitAbonoAmount() {
    if (!this.applyAbono) {
      return;
    }

    const normalizedAmount = Number.isFinite(this.abonoAmount) ? this.abonoAmount : 0;
    this.abonoAmount = Math.max(0, normalizedAmount);
    this.abonoInput = this.abonoAmount ? this.formatNumber(this.abonoAmount) : '';
    this.isEditingAbono = false;
  }

  enableAbonoEditing() {
    if (!this.applyAbono) {
      return;
    }

    this.abonoInput = this.abonoAmount ? this.formatNumber(this.abonoAmount) : '';
    this.isEditingAbono = true;
  }

  payOnline() {
    this.snackbarService.show('La integracion de pago en linea esta lista para conectarse.', 'info');
  }

  printReceipt() {
    this.document.defaultView?.print();
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
