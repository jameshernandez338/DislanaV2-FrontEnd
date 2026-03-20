import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms-and-conditions.component.html'
})
export class TermsAndConditionsComponent {}
