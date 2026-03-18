import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { StockService } from '@core/services/stock.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ImgHoverZoomDirective } from '@shared/directives/img-hover-zoom.directive';
import { NumberFormatService } from '@shared/services/number-format.service';
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
    private snackbarService: SnackbarService,
    private numberFormatService: NumberFormatService
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
    return this.numberFormatService.formatDate(value);
  }

  formatNumber(value: number): string {
    return this.numberFormatService.formatNumber(value);
  }

  formatCurrency(value: number): string {
    return this.numberFormatService.formatCurrency(value);
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
