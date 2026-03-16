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
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, LoadingSpinnerComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private formBuilder = inject(FormBuilder);
  loading = signal(false);
  showPassword = false;
  showConfirmPassword = false;

  icons = {
    Eye,
    EyeOff
  };

  registerForm: FormGroup = this.formBuilder.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  constructor(
    private authService: AuthService,
    private snackbar: SnackbarService,
    private router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    if (this.registerForm.invalid) {
      this.snackbar.show('Completa todos los campos requeridos', 'warning');
      return;
    }

    const { fullName, email, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.snackbar.show('Las contrasenas no coinciden', 'warning');
      return;
    }

    this.loading.set(true);

    this.authService
      .register({ fullName, email, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Cuenta creada correctamente', 'success');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.snackbar.show(err?.error?.message || 'No se pudo crear la cuenta', 'error');
        }
      });
  }
}
