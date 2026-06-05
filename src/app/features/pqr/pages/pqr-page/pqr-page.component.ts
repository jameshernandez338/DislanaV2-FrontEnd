import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Send, CheckCircle } from 'lucide-angular';

type PqrType = 'Pregunta' | 'Queja' | 'Reclamo';

@Component({
  selector: 'app-pqr-page',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './pqr-page.component.html'
})
export class PqrPageComponent {
  readonly pqrTypes: PqrType[] = ['Pregunta', 'Queja', 'Reclamo'];

  type: PqrType = 'Pregunta';
  subject = '';
  message = '';
  submitted = false;
  loading = false;

  readonly icons = { send: Send, check: CheckCircle };

  onSubmit(): void {
    if (!this.subject.trim() || !this.message.trim()) {
      return;
    }

    this.loading = true;

    // Simula envío — conectar al endpoint real cuando esté disponible
    setTimeout(() => {
      this.loading = false;
      this.submitted = true;
    }, 800);
  }

  onNew(): void {
    this.type = 'Pregunta';
    this.subject = '';
    this.message = '';
    this.submitted = false;
  }
}
