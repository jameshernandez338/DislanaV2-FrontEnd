import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Bell, FileText, House, LucideAngularModule, Menu, ReceiptText, ShoppingCart, UserRound, X } from 'lucide-angular';

export interface HeaderMenuItem {
  id: string;
  label: string;
  icon: 'home' | 'quote' | 'inventory' | 'portfolio' | 'collection';
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './app-header.component.html'
})
export class AppHeaderComponent {
  private authService = inject(AuthService);

  @Input() menus: HeaderMenuItem[] = [];
  @Input() cartCount = 0;
  @Input() showUserMenu = false;
  @Output() userToggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() cartToggle = new EventEmitter<void>();
  showMobileMenu = false;
  userName  = this.authService.getFullName(); 

  icons = {
    home: House,
    quote: ReceiptText,
    inventory: FileText,
    portfolio: FileText,
    collection: Bell,
    user: UserRound,
    cart: ShoppingCart,
    menu: Menu,
    close: X
  };

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }
}
