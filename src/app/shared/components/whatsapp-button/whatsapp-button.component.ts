import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-whatsapp-button',
  imports: [CommonModule],
  templateUrl: './whatsapp-button.component.html'
})
export class WhatsappButtonComponent {
  @Input() phone = '';
  @Input() message = '';
  @Input() label = 'Escribenos por WhatsApp';

  get whatsappUrl(): string {
    const cleanPhone = this.phone.replace(/\D/g, '');

    if (!cleanPhone) {
      return 'https://wa.me/';
    }

    const query = this.message.trim()
      ? `?text=${encodeURIComponent(this.message.trim())}`
      : '';

    return `https://wa.me/${cleanPhone}${query}`;
  }
}
