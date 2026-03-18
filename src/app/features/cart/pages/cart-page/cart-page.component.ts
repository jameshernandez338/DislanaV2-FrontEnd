import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartItem, CartService } from '@core/services/cart.service';
import { OrderPayload, OrderService } from '@core/services/order.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';
import { AppNumberPipe } from '@shared/pipes/app-number.pipe';
import { LucideAngularModule, X } from 'lucide-angular';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, LoadingSpinnerComponent, AppNumberPipe, AppCurrencyPipe],
  templateUrl: './cart-page.component.html'
})
export class CartPageComponent {
  private readonly destroyRef = inject(DestroyRef);

  specialTrimEnabled = false;
  specialTrimNotes = '';
  isSubmitting = false;
  icons = { X };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private snackbarService: SnackbarService,
    private router: Router
  ) {}

  get cartItems(): CartItem[] {
    return this.cartService.items();
  }

  get subtotal(): number {
    return this.cartService.subtotal;
  }

  get total(): number {
    return this.subtotal;
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
      Orillo: this.specialTrimEnabled ? this.specialTrimNotes.trim() : '',
      Items: this.cartItems.map((item) => ({
        CodigoItem: item.codigoItem,
        Cantidad1: item.quantityA,
        CantidadB: item.quantityB,
        Pvp: item.unitPriceA,
        PvpB: item.unitPriceB
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
          this.specialTrimEnabled = false;
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
}
