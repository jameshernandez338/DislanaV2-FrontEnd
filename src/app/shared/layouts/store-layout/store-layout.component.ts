import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CartService } from '@core/services/cart.service';
import { LucideAngularModule, X } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { AppFooterComponent } from '@shared/components/app-footer/app-footer.component';
import { AppHeaderComponent, HeaderMenuItem } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-store-layout',
  imports: [CommonModule, RouterOutlet, LucideAngularModule, AppHeaderComponent, AppFooterComponent],
  templateUrl: './store-layout.component.html'
})
export class StoreLayoutComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private snackbarService: SnackbarService
  ) {}

  icons = { X };
  showUserMenu = false;
  showCart = false;

  get cartSubtotal(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(this.cartService.subtotal);
  }

  get cartCount(): number {
    return this.cartService.count;
  }

  get cartItems() {
    return this.cartService.items();
  }

  get userName(): string {
    return this.authService.getFullName();
  }

  get headerMenus(): HeaderMenuItem[] {
    const currentUrl = this.router.url;

    return [
      { id: 'home', label: 'Home', icon: 'home', route: '/home', active: currentUrl.startsWith('/home') },
      { id: 'quote', label: 'Cotizar', icon: 'quote', route: '/cotizar', active: currentUrl.startsWith('/cotizar') },
      {
        id: 'inventory',
        label: 'Extracto Inventario',
        icon: 'inventory',
        route: '/extracto-inventario',
        active: currentUrl.startsWith('/extracto-inventario')
      },
      { id: 'portfolio', label: 'Extracto Cartera', icon: 'portfolio', route: '/home' },
      { id: 'collection', label: 'Nueva Coleccion', icon: 'collection', route: '/home' }
    ];
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleCart() {
    this.showCart = !this.showCart;
    this.syncBodyScroll();
    this.snackbarService.setAvoidBottomRight(this.showCart);
  }

  closeCart() {
    this.showCart = false;
    this.syncBodyScroll();
    this.snackbarService.setAvoidBottomRight(false);
  }

  removeCartItem(itemId: string) {
    this.cartService.removeItem(itemId);
    this.snackbarService.show('Producto eliminado del carrito.', 'info');
  }

  goToCart() {
    this.closeCart();
    this.router.navigate(['/carrito']);
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.unlockBodyScroll();
    this.snackbarService.setAvoidBottomRight(false);
  }

  private syncBodyScroll() {
    if (this.showCart) {
      this.lockBodyScroll();
      return;
    }

    this.unlockBodyScroll();
  }

  private lockBodyScroll() {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll() {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.style.overflow = '';
  }
}
