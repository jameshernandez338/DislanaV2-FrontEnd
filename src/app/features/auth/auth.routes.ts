import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { DataProcessingComponent } from '../legal/pages/data-processing/data-processing.component';
import { TermsAndConditionsComponent } from '../legal/pages/terms-and-conditions/terms-and-conditions.component';
import { NoAuthGuard } from '@core/guards/no-auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'tratamiento-datos',
    component: DataProcessingComponent,
    canActivate: [NoAuthGuard]
  },
  {
    path: 'terminos-condiciones',
    component: TermsAndConditionsComponent,
    canActivate: [NoAuthGuard]
  }
];
