import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppCurrencyPipe } from '@shared/pipes/app-currency.pipe';
import { PaymentResponse } from '../../models/quote.model';

@Component({
  selector: 'app-quote-receipt',
  imports: [CommonModule, AppCurrencyPipe],
  templateUrl: './quote-receipt.component.html'
})
export class QuoteReceiptComponent {
  private readonly router = inject(Router);

  printing = false;
  receipt: PaymentResponse | null = null;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    this.receipt = (navigation?.extras.state?.['paymentReceipt'] ?? history.state?.paymentReceipt ?? null) as PaymentResponse | null;

    if (!this.receipt) {
      void this.router.navigate(['/cotizar']);
    }
  }

  printReceipt() {
    if (this.printing) {
      return;
    }

    this.printing = true;
    window.print();

    setTimeout(() => {
      this.printing = false;
    }, 1000);
  }

  goHome() {
    void this.router.navigate(['/home']);
  }
}
