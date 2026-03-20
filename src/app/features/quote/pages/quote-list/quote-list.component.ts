import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { LucideAngularModule, ChevronRight, CircleAlert, CreditCard, PencilRuler, Printer, SquareMinus, X } from 'lucide-angular';
import { QuoteService } from '@core/services/quote.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { NumericInputDirective } from '@shared/directives/numeric-input.directive';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';
import { AppDatePipe } from '@shared/pipes/app-date.pipe';
import { NumberFormatService } from '@shared/services/number-format.service';
import {
  PaymentItem,
  PaymentRequest,
  PaymentResponse,
  QuoteCustomerBalanceDetail,
  QuoteCustomerTaxes,
  QuoteItem,
  WompiPayment
} from '../../models/quote.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-quote-list',
  imports: [CommonModule, FormsModule, LucideAngularModule, LoadingSpinnerComponent, NumericInputDirective, AppDatePipe, AppCurrencyPipe],
  templateUrl: './quote-list.component.html'
})
export class QuoteListComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private cupoTooltipButtonElement?: HTMLButtonElement;
  private cupoTooltipPanelElement?: HTMLDivElement;

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

  @ViewChild('cupoTooltipButton')
  set cupoTooltipButtonRef(button: ElementRef<HTMLButtonElement> | undefined) {
    this.cupoTooltipButtonElement = button?.nativeElement;
  }

  @ViewChild('cupoTooltipPanel')
  set cupoTooltipPanelRef(panel: ElementRef<HTMLDivElement> | undefined) {
    this.cupoTooltipPanelElement = panel?.nativeElement;
  }

  loading = false;
  quoteItems: QuoteItem[] = [];
  customerTaxes: QuoteCustomerTaxes | null = null;
  showPaymentDrawer = false;
  showBalanceDetailModal = false;
  showQuoteDetailModal = false;
  showCupoTooltip = false;
  creatingPayment = false;
  printingReceipt = false;
  applyReteIca = true;
  applyAbono = false;
  abonoAmount = 0;
  abonoInput = '';
  isEditingAbono = false;
  loadingBalanceDetail = false;
  balanceDetailLoadFailed = false;
  selectedBalanceDetailType = '';
  selectedBalanceDetailTitle = '';
  balanceDetailRows: QuoteCustomerBalanceDetail[] = [];
  selectedQuoteDetailItem: QuoteItem | null = null;
  quoteDetailRows: QuoteItem[] = [];
  icons = { PencilRuler, CreditCard, ChevronRight, CircleAlert, Printer, SquareMinus, X };

  constructor(
    private quoteService: QuoteService,
    private snackbarService: SnackbarService,
    private numberFormatService: NumberFormatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuotes();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showCupoTooltip) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      this.showCupoTooltip = false;
      return;
    }

    if (this.cupoTooltipButtonElement?.contains(target) || this.cupoTooltipPanelElement?.contains(target)) {
      return;
    }

    this.showCupoTooltip = false;
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

  get totales() {
    const subtotal = this.selectedItemsTotal;
    const descuentoRate = (this.customerTaxes?.descuento ?? 0) / 100;
    const ivaRate = (this.customerTaxes?.iva ?? 0) / 100;
    const reteFuenteRate = (this.customerTaxes?.reteFuente ?? 0) / 100;
    const reteIvaRate = (this.customerTaxes?.reteIva ?? 0) / 100;
    const reteIcaRate = this.applyReteIca ? ((this.customerTaxes?.reteIca ?? 0) / 100) : 0;
    const saldoAFavor = this.customerTaxes?.saldoAFavor ?? 0;
    const carteraVencida = this.customerTaxes?.cartera ?? 0;
    const apin = this.customerTaxes?.apin ?? 0;
    const usaCupo = this.customerTaxes?.usaCupo === true;
    const cupo = this.customerTaxes?.cupo ?? 0;
    const abono = this.applyAbono ? this.abonoAmount : 0;

    const descuentos = subtotal * descuentoRate;
    const iva = (subtotal - descuentos) * ivaRate;
    const reteFuente = (subtotal - descuentos + iva) * reteFuenteRate;
    const reteIva = iva > 524000 ? iva * reteIvaRate : 0;
    const reteIca = (subtotal - descuentos) * reteIcaRate;
    const apinCubiertoPorCupo = usaCupo ? Math.min(cupo, Math.max(apin, 0)) : 0;
    const apinPendiente = Math.max(apin - apinCubiertoPorCupo, 0);
    const cupoDisponibleDespuesApin = Math.max(cupo - apinCubiertoPorCupo, 0);
    const totalItemsEImpuestos = subtotal
      + iva
      - descuentos
      - reteFuente
      - reteIva
      - reteIca
      - saldoAFavor;
    const cupoAplicadoItemsEImpuestos = usaCupo
      ? Math.min(cupoDisponibleDespuesApin, Math.max(totalItemsEImpuestos, 0))
      : 0;
    const total = carteraVencida
      + apinPendiente
      + Math.max(totalItemsEImpuestos - cupoAplicadoItemsEImpuestos, 0)
      + abono;
    const cupoUtilizado = apinCubiertoPorCupo + cupoAplicadoItemsEImpuestos;

    return {
      subtotal,
      descuentos,
      iva,
      reteFuente,
      reteIva,
      reteIca,
      saldoAFavor,
      carteraVencida,
      apin,
      totalItemsEImpuestos,
      apinCubiertoPorCupo,
      apinPendiente,
      cupoAplicadoItemsEImpuestos,
      cupoUtilizado,
      total,
      usaCupo,
      cupo,
      cupoDisponibleDespuesApin,
      abono
    };
  }

  get shouldShowCupo(): boolean {
    return this.totales.usaCupo;
  }

  get subtotalToPay(): number {
    return this.totales.subtotal;
  }

  get discountToPay(): number {
    return this.totales.descuentos;
  }

  get ivaToPay(): number {
    return this.totales.iva;
  }

  get reteFuenteToPay(): number {
    return this.totales.reteFuente;
  }

  get reteIvaToPay(): number {
    return this.totales.reteIva;
  }

  get reteIcaToPay(): number {
    return this.totales.reteIca;
  }

  get carteraToPay(): number {
    return this.totales.carteraVencida;
  }

  get apinToPay(): number {
    return this.totales.apin;
  }

  get apinPendingToPay(): number {
    return this.totales.apinPendiente;
  }

  get saldoAFavorToPay(): number {
    return this.totales.saldoAFavor;
  }

  get abonoToPay(): number {
    return this.totales.abono;
  }

  get cupoToPay(): number {
    return this.totales.cupo;
  }

  get cupoUsedToPay(): number {
    return this.totales.cupoUtilizado;
  }

  get cupoUsedForApinToPay(): number {
    return this.totales.apinCubiertoPorCupo;
  }

  get cupoUsedForItemsToPay(): number {
    return this.totales.cupoAplicadoItemsEImpuestos;
  }

  get cupoRemainingToPay(): number {
    return Math.max(this.totales.cupo - this.totales.cupoUtilizado, 0);
  }

  get totalToPay(): number {
    return this.totales.total;
  }

  shouldShowDetailAction(item: QuoteItem): boolean {
    return this.normalizeFlag(item.acabado) === 'NO' && this.normalizeFlag(item.linea) === 'SI';
  }

  openDetail(item: QuoteItem) {
    this.selectedQuoteDetailItem = item;
    this.quoteDetailRows = this.quoteItems.filter((quoteItem) => quoteItem.codigo === item.codigo);
    this.showQuoteDetailModal = true;
  }

  closeQuoteDetailModal() {
    this.showQuoteDetailModal = false;
    this.selectedQuoteDetailItem = null;
    this.quoteDetailRows = [];
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
    this.showCupoTooltip = false;
    this.unlockBodyScroll();
  }

  toggleCupoTooltip() {
    this.showCupoTooltip = !this.showCupoTooltip;
  }

  openBalanceDetail(type: 'cartera' | 'apin' | 'saldoAFavor') {
    const titleMap: Record<typeof type, string> = {
      cartera: 'Cartera Vencida',
      apin: 'APIN',
      saldoAFavor: 'Saldo a Favor'
    };

    this.selectedBalanceDetailType = type;
    this.selectedBalanceDetailTitle = titleMap[type];
    this.balanceDetailRows = [];
    this.balanceDetailLoadFailed = false;
    this.loadingBalanceDetail = true;
    this.showBalanceDetailModal = true;

    this.quoteService.getCustomerBalance(type)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingBalanceDetail = false;
        })
      )
      .subscribe({
        next: (rows) => {
          this.balanceDetailRows = rows;
        },
        error: (error) => {
          console.error(`No se pudo cargar el detalle de ${type}.`, error);
          this.balanceDetailRows = [];
          this.balanceDetailLoadFailed = true;
          this.snackbarService.show(`No fue posible cargar el detalle de ${titleMap[type]}.`, 'error');
        }
      });
  }

  closeBalanceDetailModal() {
    this.showBalanceDetailModal = false;
    this.loadingBalanceDetail = false;
    this.balanceDetailLoadFailed = false;
    this.selectedBalanceDetailType = '';
    this.selectedBalanceDetailTitle = '';
    this.balanceDetailRows = [];
  }

  formatNumber(value: number): string {
    return this.numberFormatService.formatNumber(value);
  }

  formatCurrency(value: number): string {
    return this.numberFormatService.formatCurrency(value);
  }

  private loadQuotes() {
    this.loading = true;

    forkJoin({
      quotes: this.quoteService.getQuotes(),
      customerTaxes: this.quoteService.getCustomerTaxes()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: ({ quotes, customerTaxes }) => {
          this.quoteItems = quotes;
          this.customerTaxes = customerTaxes;
        },
        error: (error) => {
          console.error('No se pudo cargar la lista de cotizacion.', error);
          this.quoteItems = [];
          this.customerTaxes = null;
          this.snackbarService.show('No fue posible cargar la lista de cotizacion.', 'error');
        }
      });
  }

  private normalizeFlag(value: string): string {
    return (value || '').trim().toUpperCase();
  }

  openPaymentDetail() {
    if (this.totalToPay === 0) {
      this.snackbarService.show('El total a pagar debe ser diferente de cero para ver el detalle de pago.', 'warning');
      return;
    }

    this.applyReteIca = (this.customerTaxes?.reteIca ?? 0) > 0;
    this.applyAbono = false;
    this.abonoAmount = 0;
    this.abonoInput = '';
    this.isEditingAbono = false;
    this.showCupoTooltip = false;
    this.showPaymentDrawer = true;
    this.lockBodyScroll();
  }

  onApplyAbonoChange(checked: boolean) {
    this.applyAbono = checked;

    if (checked) {
      this.abonoInput = this.abonoAmount ? this.formatNumber(this.abonoAmount) : '';
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
    if (this.totalToPay <= 0) {
      this.snackbarService.show('El total a pagar debe ser diferente de cero para continuar con el pago en linea.', 'warning');
      return;
    }

    if (this.creatingPayment) {
      return;
    }

    const payload = this.buildPaymentRequest();
    this.creatingPayment = true;

    this.quoteService.createPayment(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.creatingPayment = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.redirectToWompi(response);
        },
        error: (error) => {
          console.error('No se pudo crear el pago en linea.', error);
          this.snackbarService.show('No fue posible iniciar el pago en linea.', 'error');
        }
      });
  }

  async printReceipt() {
    if (this.totalToPay <= 0) {
      this.snackbarService.show('El total a pagar debe ser diferente de cero para imprimir el recibo.', 'warning');
      return;
    }

    if (this.printingReceipt) {
      return;
    }

    const result = await Swal.fire({
      title: 'Imprimir recibo',
      text: 'Desea imprimir el recibo?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, imprimir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    const payload = this.buildPaymentRequest();
    this.printingReceipt = true;

    this.quoteService.savePaymentOnly(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.printingReceipt = false;
        })
      )
      .subscribe({
        next: async (response) => {
          await this.openReceiptScreen(response);
        },
        error: (error) => {
          console.error('No se pudo guardar el recibo para impresion.', error);
          this.snackbarService.show('No fue posible preparar el recibo para impresion.', 'error');
        }
      });
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

  private buildPaymentRequest(): PaymentRequest {
    return {
      ValorTotal: Number(this.totalToPay || 0),
      Items: [
        ...this.buildPaymentDetailItems(),
        ...this.buildSelectedQuoteItems()
      ]
    };
  }

  private buildPaymentDetailItems(): PaymentItem[] {
    const paymentDetails: PaymentItem[] = [];
    const totals = this.totales;

    this.addPaymentDetailItem(paymentDetails, 'Subtotal', 'Subtotal', totals.subtotal);
    this.addPaymentDetailItem(paymentDetails, 'Descuentos', 'Descuentos', totals.descuentos);
    this.addPaymentDetailItem(paymentDetails, 'IVA', 'Impuesto IVA', totals.iva);
    this.addPaymentDetailItem(paymentDetails, 'ReteFuente', 'Rete Fuente', totals.reteFuente);
    this.addPaymentDetailItem(paymentDetails, 'ReteIVA', 'Rete IVA', totals.reteIva);
    this.addPaymentDetailItem(paymentDetails, 'ReteICA', 'Rete ICA', totals.reteIca);
    this.addPaymentDetailItem(paymentDetails, 'Cartera', 'Cartera Vencida', totals.carteraVencida);
    this.addPaymentDetailItem(paymentDetails, 'APIN', 'APIN', totals.apin);
    this.addPaymentDetailItem(paymentDetails, 'SaldoAFavor', 'Saldo a Favor', totals.saldoAFavor);
    this.addPaymentDetailItem(paymentDetails, 'CupoUtilizado', 'Cupo Utilizado', totals.cupoUtilizado);
    this.addPaymentDetailItem(paymentDetails, 'Abono', 'Abono', totals.abono);

    return paymentDetails;
  }

  private addPaymentDetailItem(items: PaymentItem[], documento: string, item: string, value: number) {
    if (!value) {
      return;
    }

    items.push({
      Tipo: 'pago',
      Documento: documento,
      Item: item,
      Cantidad: 1,
      Valor: Number(value || 0)
    });
  }

  private buildSelectedQuoteItems(): PaymentItem[] {
    return this.selectedQuoteItems.map((quoteItem) => ({
      Tipo: 'item',
      Documento: quoteItem.documento,
      Item: `${quoteItem.codigo} - ${quoteItem.descripcion}`,
      Cantidad: Number(quoteItem.cantidad || 0),
      Valor: Number(quoteItem.precioTotal || 0)
    }));
  }

  private redirectToWompi(response: WompiPayment) {
    const form = this.document.createElement('form');
    form.method = 'GET';
    form.action = response.urlBase;
    const fields: Record<string, string> = {
      'public-key': response.publicKey,
      'currency': response.currency,
      'amount-in-cents': String(response.amountInCents),
      'reference': response.reference,
      'signature:integrity': response.signature,
      'redirect-url': response.redirectUrl
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = this.document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    this.document.body.appendChild(form);
    form.submit();
  }

  private async openReceiptScreen(response: PaymentResponse) {
    await this.router.navigate(['/cotizar/recibo'], {
      state: {
        paymentReceipt: response
      }
    });
  }
}
