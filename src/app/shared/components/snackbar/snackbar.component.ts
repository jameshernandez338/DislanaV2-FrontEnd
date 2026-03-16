import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CircleAlert, CircleCheck, CircleX, Info, X } from 'lucide-angular';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-snackbar',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './snackbar.component.html'
})
export class SnackbarComponent {
  snackbarService = inject(SnackbarService);

  icons = {
    success: CircleCheck,
    error: CircleX,
    warning: CircleAlert,
    info: Info,
    close: X
  };
}
