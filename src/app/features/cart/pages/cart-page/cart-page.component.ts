import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartItem, CartItemFinish, CartService } from '@core/services/cart.service';
import { FabricFinishDto, OrderPayload, OrderService } from '@core/services/order.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';
import { AppNumberPipe } from '@shared/pipes/app-number.pipe';
import { LucideAngularModule, Check, Plus, PencilRuler, X } from 'lucide-angular';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

interface FinishOption {
  id: string;
  acabado: string;
  texto: boolean;
  valor: number;
}

@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, LoadingSpinnerComponent, AppNumberPipe, AppCurrencyPipe],
  templateUrl: './cart-page.component.html'
})
export class CartPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  specialTrimNotes = '';
  isSubmitting = false;
  isLoadingFinishes = false;
  showFinishesModal = false;
  selectedCartItem: CartItem | null = null;
  selectedFinishes: CartItemFinish[] = [];
  availableFinishes: FinishOption[] = [];
  icons = { X, PencilRuler, Plus, Check };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private snackbarService: SnackbarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFabricFinishes();
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  get cartItems(): CartItem[] {
    return this.cartService.items();
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + this.getItemGrandTotal(item), 0);
  }

  get total(): number {
    return this.subtotal;
  }

  getItemMeters(item: CartItem): number {
    return (item.quantityA || 0) + (item.quantityB || 0);
  }

  getItemFinishesTotal(item: CartItem): number {
    const meters = this.getItemMeters(item);
    const finishesValuePerMeter = (item.acabados ?? []).reduce((sum, acabado) => sum + (acabado.valor || 0), 0);

    return meters * finishesValuePerMeter;
  }

  getItemGrandTotal(item: CartItem): number {
    return (item.total || 0) + this.getItemFinishesTotal(item);
  }

  trackByFinish(_: number, finish: CartItemFinish): string {
    return finish.id;
  }

  isFinishSelected(optionId: string): boolean {
    return this.selectedFinishes.some((finish) => finish.id === optionId);
  }

  getSelectedFinish(optionId: string): CartItemFinish | undefined {
    return this.selectedFinishes.find((finish) => finish.id === optionId);
  }

  openFinishesModal(item: CartItem) {
    this.selectedCartItem = item;
    this.selectedFinishes = (item.acabados ?? []).map((finish) => ({ ...finish }));
    this.showFinishesModal = true;
    this.lockBodyScroll();
  }

  closeFinishesModal() {
    this.showFinishesModal = false;
    this.selectedCartItem = null;
    this.selectedFinishes = [];
    this.unlockBodyScroll();
  }

  toggleFinish(option: FinishOption) {
    const alreadySelected = this.isFinishSelected(option.id);

    if (alreadySelected) {
      this.selectedFinishes = this.selectedFinishes.filter((finish) => finish.id !== option.id);
      return;
    }

    this.selectedFinishes = [
      ...this.selectedFinishes,
      {
        id: option.id,
        acabado: option.acabado,
        texto: option.texto,
        textoValor: '',
        valor: option.valor
      }
    ];
  }

  updateFinishText(optionId: string, value: string) {
    this.selectedFinishes = this.selectedFinishes.map((finish) =>
      finish.id === optionId
        ? {
            ...finish,
            textoValor: value
          }
        : finish
    );
  }

  saveFinishes() {
    if (!this.selectedCartItem) {
      return;
    }

    this.cartService.updateItemFinishes(this.selectedCartItem.id, this.selectedFinishes);
    this.snackbarService.show('Acabados actualizados para el producto.', 'success');
    this.closeFinishesModal();
  }

  removeItem(itemId: string) {
    this.cartService.removeItem(itemId);
    this.snackbarService.show('Producto eliminado del carrito.', 'info');
  }

  placeOrder() {
    if (this.cartItems.length === 0) {
      this.snackbarService.show('No hay productos en el carrito.', 'warning');
      return;
    }

    const payload: OrderPayload = {
      Observacion: this.specialTrimNotes.trim(),
      Items: this.cartItems.map((item) => ({
        CodigoItem: item.codigoItem,
        Cantidad1: item.quantityA,
        CantidadB: item.quantityB,
        Pvp: item.unitPriceA,
        PvpB: item.unitPriceB,
        Acabados: (item.acabados ?? []).map((acabado) => ({
          Acabado: acabado.acabado,
          Texto: acabado.textoValor.trim(),
          Valor: acabado.valor
        }))
      }))
    };

    this.isSubmitting = true;

    this.orderService.placeOrder(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: async (response) => {
          this.cartService.clear();
          this.specialTrimNotes = '';

          await Swal.fire({
            title: 'Pedido enviado',
            text: response.message,
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });

          await this.router.navigate(['/home']);
        },
        error: () => {
          this.snackbarService.show('No fue posible enviar el pedido.', 'error');
        }
      });
  }

  private loadFabricFinishes() {
    this.isLoadingFinishes = true;

    this.orderService.getFabricFinishes()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingFinishes = false;
        })
      )
      .subscribe({
        next: (finishes) => {
          this.availableFinishes = finishes.map((finish) => this.mapFinishOption(finish));
        },
        error: () => {
          this.availableFinishes = [];
          this.snackbarService.show('No fue posible cargar los acabados.', 'error');
        }
      });
  }

  private mapFinishOption(finish: FabricFinishDto): FinishOption {
    return {
      id: this.buildFinishId(finish.acabado),
      acabado: finish.acabado,
      texto: finish.tieneTexto,
      valor: finish.valor
    };
  }

  private buildFinishId(acabado: string): string {
    return (acabado || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  private lockBodyScroll() {
    this.document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll() {
    this.document.body.style.overflow = '';
  }
}
