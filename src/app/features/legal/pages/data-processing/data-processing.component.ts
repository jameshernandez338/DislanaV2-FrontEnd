import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-data-processing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-processing.component.html'
})
export class DataProcessingComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
