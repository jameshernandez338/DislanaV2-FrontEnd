import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { StockService } from '@core/services/stock.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ImgHoverZoomDirective } from '@shared/directives/img-hover-zoom.directive';
import { InventoryStatementItem } from '../../models/stock.model';

@Component({
  selector: 'app-inventory-statement',
  imports: [CommonModule, LoadingSpinnerComponent, ImgHoverZoomDirective],
  templateUrl: './inventory-statement.component.html'
})
export class InventoryStatementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly groups = [
    'PEDIDOS PENDIENTES',
    'PENDIENTES POR FACTURAR',
    'PENDIENTES POR DESPACHAR'
  ];

  loading = false;
  statementItems: InventoryStatementItem[] = [];

  constructor(
    private stockService: StockService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadStatement();
  }

  getRowsByGroup(group: string): InventoryStatementItem[] {
    return this.statementItems.filter((item) => (item.grupo || '').trim().toUpperCase() === group);
  }

  getActionLabel(group: string): string {
    switch (group) {
      case 'PEDIDOS PENDIENTES':
        return 'Cancelar';
      case 'PENDIENTES POR FACTURAR':
        return 'Cotizar';
      case 'PENDIENTES POR DESPACHAR':
        return 'Cotizar';
      default:
        return 'Continuar';
    }
  }

  onGroupAction(group: string) {
    switch (group) {
      case 'PEDIDOS PENDIENTES':
        this.handlePendingOrdersAction();
        return;
      case 'PENDIENTES POR FACTURAR':
        this.handlePendingInvoicesAction();
        return;
      case 'PENDIENTES POR DESPACHAR':
        this.handlePendingDispatchAction();
        return;
      default:
        return;
    }
  }

  getImageUrl(item: InventoryStatementItem): string {
    return item.imagen || '/images/categories/school.png';
  }

  formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      const normalizedValue = value.split('T')[0];
      const parts = normalizedValue.split(/[-/]/);

      if (parts.length === 3) {
        const [year, month, day] = parts;

        if (year.length === 4) {
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }

      return value;
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(parsedDate);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value ?? 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  private loadStatement() {
    this.loading = true;

    this.stockService.getInventoryStatement()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (items) => {
          this.statementItems = items;
        },
        error: (error) => {
          console.error('No se pudo cargar el extracto de inventario.', error);
          this.statementItems = [];
          this.snackbarService.show('No fue posible cargar el extracto de inventario.', 'error');
        }
      });
  }

  private handlePendingOrdersAction() {
    this.snackbarService.show('Accion de pedidos pendientes pendiente por implementar.', 'info');
  }

  private handlePendingInvoicesAction() {
    this.snackbarService.show('Accion de pendientes por facturar pendiente por implementar.', 'info');
  }

  private handlePendingDispatchAction() {
    this.snackbarService.show('Accion de pendientes por despachar pendiente por implementar.', 'info');
  }
}
