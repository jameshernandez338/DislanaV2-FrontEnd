import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'cotizar/recibo',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/quote/pages/quote-receipt/quote-receipt.component')
        .then(m => m.QuoteReceiptComponent)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./shared/layouts/store-layout/store-layout.component')
        .then(m => m.StoreLayoutComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component')
            .then(m => m.HomeComponent)
      },
      {
        path: 'cotizar',
        loadComponent: () =>
          import('./features/quote/pages/quote-list/quote-list.component')
            .then(m => m.QuoteListComponent)
      },
      {
        path: 'productos/:id',
        loadComponent: () =>
          import('./features/products/pages/product-detail/product-detail.component')
            .then(m => m.ProductDetailComponent)
      },
      {
        path: 'carrito',
        loadComponent: () =>
          import('./features/cart/pages/cart-page/cart-page.component')
            .then(m => m.CartPageComponent)
      },
      {
        path: 'extracto-inventario',
        loadComponent: () =>
          import('./features/stock/pages/inventory-statement/inventory-statement.component')
            .then(m => m.InventoryStatementComponent)
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/pages/transactions-page/transactions-page.component')
            .then(m => m.TransactionsPageComponent)
      }
    ]
  }
];
