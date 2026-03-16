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
      }
    ]
  }
];
