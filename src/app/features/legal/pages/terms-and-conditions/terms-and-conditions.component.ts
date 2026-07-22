import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-and-conditions.component.html'
})
export class TermsAndConditionsComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
