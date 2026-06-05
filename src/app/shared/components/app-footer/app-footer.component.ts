import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, MapPin, Phone, Mail, MessageSquare } from 'lucide-angular';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './app-footer.component.html'
})
export class AppFooterComponent {
  icons = {
    mapPin: MapPin,
    phone: Phone,
    mail: Mail,
    messageSquare: MessageSquare
  };
}
