import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private formBuilder = inject(FormBuilder);
  loading = signal(false);
  showPassword = false;

  icons = {
    Eye,
    EyeOff
  };

  loginForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private authService: AuthService,
    private snackbar: SnackbarService,
    private router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (this.loginForm.invalid) {
      const controls = this.loginForm.controls;

      if (controls['email'].invalid) {
        if (controls['email'].hasError('required')) {
          this.snackbar.show('Debe ingresar un correo', 'warning');
        } else if (controls['email'].hasError('email')) {
          this.snackbar.show('Debe ingresar un correo valido', 'warning');
        }
        return;
      }

      if (controls['password'].invalid) {
        if (controls['password'].hasError('required')) {
          this.snackbar.show('Debe ingresar una contrasena', 'warning');
        }
        return;
      }
    }

    this.loading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService
      .login({ email, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.authService.setSession(res.token, res.fullName);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.snackbar.show(err?.error?.message || 'Ocurrio un error', 'error');
        }
      });
  }
}
