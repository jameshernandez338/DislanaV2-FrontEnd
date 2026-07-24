import { CommonModule } from '@angular/common';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import Swal from 'sweetalert2';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { StockService } from '@core/services/stock.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ImgHoverZoomDirective } from '@shared/directives/img-hover-zoom.directive';
import { NumberFormatService } from '@shared/services/number-format.service';
import { InventoryStatementItem } from '../../models/stock.model';

@Component({
  selector: 'app-inventory-statement',
  imports: [CommonModule, LucideAngularModule, LoadingSpinnerComponent, ImgHoverZoomDirective],
  templateUrl: './inventory-statement.component.html'
})
export class InventoryStatementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly groups = [
    'PEDIDOS PENDIENTES',
    'PENDIENTES POR FACTURAR',
    'PENDIENTES POR DESPACHAR'
  ];

  readonly icons = { Trash2 };
  loading = false;
  statementItems: InventoryStatementItem[] = [];

  constructor(
    private stockService: StockService,
    private snackbarService: SnackbarService,
    private numberFormatService: NumberFormatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStatement();
  }

  getRowsByGroup(group: string): InventoryStatementItem[] {
    return this.statementItems.filter((item) => (item.grupo || '').trim().toUpperCase() === group);
  }

  getActionLabel(group: string): string {
    switch (group) {
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

  async deleteRow(row: InventoryStatementItem): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar registro?',
      text: `¿Desea eliminar el pedido "${row.documento} - ${row.descripcion}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
      this.loading = true;

      this.stockService.cancelOrder(row.documento, row.item)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: () => {
            this.statementItems = this.statementItems.filter(
              (item) => !(item.documento === row.documento && item.item === row.item && item.fecha === row.fecha)
            );
            this.snackbarService.show('Registro eliminado correctamente.', 'success');
          },
          error: (error) => {
            console.error('No se pudo cancelar el pedido.', error);
            this.snackbarService.show('No fue posible cancelar el pedido.', 'error');
          }
        });
    }
  }

  private handlePendingInvoicesAction() {
    this.router.navigate(['/cotizar']);
  }

  private handlePendingDispatchAction() {
    this.snackbarService.show('Accion de pendientes por despachar pendiente por implementar.', 'info');
  }
}
