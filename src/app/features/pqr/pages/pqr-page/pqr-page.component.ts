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

  readonly claimReasons: string[] = [
    'ANULACION DE LA PROGRAMACION',
    'DECLINO LA COMPRA',
    'DEVOLUCION DE DINERO',
    'ITEM ENVIADO EQUIVOCADO',
    'ITEM MAL CODIFICADO',
    'PRODUCTO DEFECTUOSO',
    'DESPACHO INCOMPLETO',
    'PROCTO DEFECTUOSO PARA REPROCESO',
    'EXTRAVIO DE MERCANCIA'
  ];

  type: PqrType = 'Pregunta';
  claimReason = '';
  message = '';
  submitted = false;
  loading = false;

  readonly icons = { send: Send, check: CheckCircle };

  onSubmit(): void {
    if (this.type === 'Reclamo' && !this.claimReason) {
      return;
    }

    if (!this.message.trim()) {
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
    this.claimReason = '';
    this.message = '';
    this.submitted = false;
  }
}
