import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-data-processing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './data-processing.component.html'
})
export class DataProcessingComponent {}
