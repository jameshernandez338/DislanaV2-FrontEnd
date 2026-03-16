import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private formBuilder = inject(FormBuilder);
  loading = signal(false);

  forgotPasswordForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(
    private authService: AuthService,
    private snackbar: SnackbarService
  ) {}

  submit() {
    if (this.forgotPasswordForm.invalid) {
      this.snackbar.show('Ingresa un correo valido', 'warning');
      return;
    }

    const { email } = this.forgotPasswordForm.value;
    this.loading.set(true);

    this.authService
      .forgotPassword({ email })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Revisa tu correo para continuar', 'success');
        },
        error: (err) => {
          this.snackbar.show(err?.error?.message || 'No se pudo procesar la solicitud', 'error');
        }
      });
  }
}
