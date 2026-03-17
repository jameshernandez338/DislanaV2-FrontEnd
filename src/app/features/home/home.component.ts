import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { LucideAngularModule, Ruler, Search, X } from 'lucide-angular';
import { ProductService } from '@core/services/product.service';
import { StockService } from '@core/services/stock.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { OverflowAnimateDirective } from '@shared/directives/overflow-animate.directive';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { WhatsappButtonComponent } from '@shared/components/whatsapp-button/whatsapp-button.component';
import { CommittedStockItem } from '../stock/models/stock.model';
import { FilterGroup, FilterOption, ProductFilterItem, ProductListItem } from './models/home-filter.model';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    OverflowAnimateDirective,
    LoadingSpinnerComponent,
    WhatsappButtonComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly filtersType = 'home';
  private readonly pageSize = 15;
  private readonly filterFieldMap: Record<string, keyof ProductListItem> = {
    codigoitem: 'codigoItem',
    descripcionitem: 'descripcionItem',
    imagen: 'imagen',
    pvp: 'pvp',
    disponible: 'disponible',
    departamento: 'departamento',
    ciudad: 'ciudad',
    nombre: 'nombre',
    cts: 'cts',
    tipo: 'tipo',
    acabado: 'acabado',
    categoria: 'categoria',
    atributo: 'atributo',
    color: 'color',
    detalle: 'detalle',
    separado: 'separado',
    pendiente: 'pendiente'
  };

  constructor(
    private productService: ProductService,
    private stockService: StockService,
    private snackbarService: SnackbarService
  ) {}

  icons = { Search, X, Ruler };
  showFiltersDrawer = false;
  showSortMenu = false;
  loadingFilters = signal(false);
  currentPage = signal(1);
  productSearch = '';
  selectedSort = 'ORDENAR POR';

  sortOptions = ['ORDENAR POR', 'MAYOR PRECIO', 'MENOR PRECIO', 'REFERENCIA'];

  filterGroups: FilterGroup[] = [];
  filterSearchMap: Record<string, string> = {};
  selectedFilterMap: Record<string, string[]> = {};
  closedFilterGroups = new Set<string>();

  products: ProductListItem[] = [];
  filteredProducts: ProductListItem[] = [];
  paginatedProducts: ProductListItem[] = [];
  selectedStatusProduct: ProductListItem | null = null;
  pendingOrdersRows: CommittedStockItem[] = [];
  pendingInvoicesRows: CommittedStockItem[] = [];
  loadingCommittedStock = false;
  committedStockLoadFailed = false;
  totalPages = 1;
  visiblePages: number[] = [1];
  visibleRangeStart = 0;
  visibleRangeEnd = 0;

  ngOnInit(): void {
    this.loadFilters();
  }

  getFilterOptions(group: FilterGroup): FilterOption[] {
    const search = (this.filterSearchMap[group.id] || '').trim().toLowerCase();
    if (!search) {
      return group.options;
    }

    return group.options.filter((item) => item.label.toLowerCase().includes(search));
  }

  isGroupOpen(groupId: string): boolean {
    return !this.closedFilterGroups.has(groupId);
  }

  toggleGroup(groupId: string) {
    if (this.closedFilterGroups.has(groupId)) {
      this.closedFilterGroups.delete(groupId);
      return;
    }

    this.closedFilterGroups.add(groupId);
  }

  toggleFiltersDrawer() {
    this.showFiltersDrawer = !this.showFiltersDrawer;
  }

  closeFiltersDrawer() {
    this.showFiltersDrawer = false;
  }

  toggleSortMenu() {
    this.showSortMenu = !this.showSortMenu;
  }

  onProductSearchChange() {
    this.currentPage.set(1);
    this.updateProductView();
  }

  selectSort(option: string) {
    this.selectedSort = option;
    this.currentPage.set(1);
    this.showSortMenu = false;
    this.updateProductView();
  }

  getProductId(item: ProductListItem): string {
    return [
      item.codigoItem,
      item.descripcionItem,
      item.detalle,
      item.imagen,
      item.pvp,
      item.disponible
    ]
      .map((value) => `${value ?? ''}`.trim())
      .join('|');
  }

  getProductImage(item: ProductListItem): string {
    return item.imagen || '/images/categories/school.png';
  }

  getProductAvailable(item: ProductListItem): string {
    return item.disponible !== undefined ? `Disponible (${item.disponible} mtrs)` : 'Disponible';
  }

  getProductSeparated(item: ProductListItem): string {
    return item.separado !== undefined ? `Separados ${item.separado}` : 'Separado';
  }

  getProductPending(item: ProductListItem): string {
    return item.pendiente !== undefined ? `Pendientes ${item.pendiente}` : 'Pendiente';
  }

  hasProductStatus(item: ProductListItem): boolean {
    return (item.separado ?? 0) > 0 || (item.pendiente ?? 0) > 0;
  }

  openStatusModal(item: ProductListItem) {
    if (!this.hasProductStatus(item)) {
      return;
    }

    this.loadingCommittedStock = true;
    this.committedStockLoadFailed = false;
    this.pendingOrdersRows = [];
    this.pendingInvoicesRows = [];
    this.selectedStatusProduct = item;

    this.stockService.getCommittedStock(item.codigoItem)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingCommittedStock = false;
        })
      )
      .subscribe({
        next: (rows) => {
          if (!this.selectedStatusProduct || this.selectedStatusProduct.codigoItem !== item.codigoItem) {
            return;
          }

          this.pendingOrdersRows = this.getCommittedStockRows(rows, 'PEDIDOS PENDIENTES');
          this.pendingInvoicesRows = this.getCommittedStockRows(rows, 'PENDIENTES POR FACTURAR');
        },
        error: (error) => {
          console.error('No se pudo cargar el inventario comprometido.', error);
          this.committedStockLoadFailed = true;
          this.snackbarService.show('No fue posible consultar el inventario comprometido.', 'error');
        }
      });
  }

  closeStatusModal() {
    this.selectedStatusProduct = null;
    this.pendingOrdersRows = [];
    this.pendingInvoicesRows = [];
    this.loadingCommittedStock = false;
    this.committedStockLoadFailed = false;
  }

  getPendingOrders(): CommittedStockItem[] {
    return this.pendingOrdersRows;
  }

  getPendingInvoices(): CommittedStockItem[] {
    return this.pendingInvoicesRows;
  }

  formatCommittedStockDate(value: string): string {
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

  getProductPrice(item: ProductListItem): string {
    if (item.pvp === undefined) {
      return 'Pvp';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(item.pvp);
  }

  getProductRoute(item: ProductListItem): string[] {
    return ['/productos', item.codigoItem || item.descripcionItem || item.detalle || 'producto'];
  }

  isOptionSelected(groupId: string, optionValue: string): boolean {
    return (this.selectedFilterMap[groupId] || []).includes(optionValue);
  }

  toggleFilterOption(groupId: string, optionValue: string, checked: boolean) {
    const currentValues = this.selectedFilterMap[groupId] || [];
    this.selectedFilterMap[groupId] = checked
      ? [...currentValues, optionValue]
      : currentValues.filter((value) => value !== optionValue);

    this.currentPage.set(1);
    this.updateProductView();
  }

  preventMouseFocus(event: MouseEvent) {
    event.preventDefault();
  }

  goToPage(page: number) {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages));
    this.updatePagination();
  }

  goToPreviousPage() {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  goToFirstPage() {
    this.goToPage(1);
  }

  goToLastPage() {
    this.goToPage(this.totalPages);
  }

  private loadFilters() {
    this.loadingFilters.set(true);

    forkJoin({
      filters: this.productService.getFilters(this.filtersType),
      products: this.productService.getProducts(this.filtersType)
    }).pipe(
      finalize(() => this.loadingFilters.set(false))
    ).subscribe({
      next: ({ filters, products }) => {
        this.filterGroups = this.buildFilterGroups(filters);
        this.products = products;
        this.filterSearchMap = this.filterGroups.reduce<Record<string, string>>((acc, group) => {
          acc[group.id] = '';
          return acc;
        }, {});
        this.selectedFilterMap = this.filterGroups.reduce<Record<string, string[]>>((acc, group) => {
          acc[group.id] = [];
          return acc;
        }, {});
        this.currentPage.set(1);
        this.updateProductView();
      },
      error: (error) => {
        console.error('No se pudo cargar la informacion del home.', error);
        this.filterGroups = [];
        this.filterSearchMap = {};
        this.selectedFilterMap = {};
        this.products = [];
        this.updateProductView();
      }
    });
  }

  private buildFilterGroups(items: ProductFilterItem[]): FilterGroup[] {
    const groupsMap = new Map<string, FilterGroup>();

    for (const item of items) {
      const label = (item.filtro || '').trim();
      const value = (item.valor || '').trim();
      const field = (item.campoVista || '').trim();

      if (!label || !value) {
        continue;
      }

      const groupId = this.toKey(label);
      const optionId = this.toKey(value);
      const existingGroup = groupsMap.get(groupId);

      if (!existingGroup) {
        groupsMap.set(groupId, {
          id: groupId,
          label,
          field,
          searchPlaceholder: 'Buscar',
          options: [{ id: optionId, label: value, value }]
        });
        continue;
      }

      if (!existingGroup.field && field) {
        existingGroup.field = field;
      }

      if (!existingGroup.options.some((option) => option.label === value)) {
        existingGroup.options.push({ id: optionId, label: value, value });
      }
    }

    return Array.from(groupsMap.values());
  }

  private sortProducts(items: ProductListItem[]): ProductListItem[] {
    switch (this.selectedSort) {
      case 'MAYOR PRECIO':
        return [...items].sort((a, b) => (b.pvp ?? 0) - (a.pvp ?? 0));
      case 'MENOR PRECIO':
        return [...items].sort((a, b) => (a.pvp ?? 0) - (b.pvp ?? 0));
      case 'REFERENCIA':
        return [...items].sort((a, b) =>
          (a.descripcionItem || '').localeCompare(b.descripcionItem || '', 'es', { sensitivity: 'base' })
        );
      default:
        return items;
    }
  }

  private updateProductView() {
    const term = this.productSearch.trim().toLowerCase();
    const searchedProducts = !term
      ? this.products
      : this.products.filter((item) =>
          (item.descripcionItem || '').toLowerCase().includes(term) ||
          (item.codigoItem || '').toLowerCase().includes(term) ||
          (item.detalle || '').toLowerCase().includes(term)
        );

    const activeGroups = this.filterGroups.filter((group) => (this.selectedFilterMap[group.id] || []).length > 0);
    const filtered = activeGroups.length === 0
      ? searchedProducts
      : searchedProducts.filter((item) =>
          activeGroups.every((group) => {
            const productValue = this.getComparableProductFieldValue(item, group.field || group.label);
            const selectedValues = this.selectedFilterMap[group.id] || [];

            return selectedValues.some((value) => this.toKey(value) === productValue);
          })
        );

    this.filteredProducts = this.sortProducts(filtered);
    this.totalPages = Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));

    if (this.currentPage() > this.totalPages) {
      this.currentPage.set(this.totalPages);
    }

    this.updatePagination();
  }

  private updatePagination() {
    const current = this.currentPage();
    const start = (current - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedProducts = this.filteredProducts.slice(start, end);
    this.visibleRangeStart = this.filteredProducts.length === 0 ? 0 : start + 1;
    this.visibleRangeEnd = Math.min(current * this.pageSize, this.filteredProducts.length);

    const pageStart = Math.max(1, current - 2);
    const pageEnd = Math.min(this.totalPages, pageStart + 4);
    const adjustedStart = Math.max(1, pageEnd - 4);

    this.visiblePages = Array.from(
      { length: pageEnd - adjustedStart + 1 },
      (_, index) => adjustedStart + index
    );
  }

  private getCommittedStockRows(items: CommittedStockItem[], group: string): CommittedStockItem[] {
    return items.filter((item) => (item.grupo || '').trim().toUpperCase() === group);
  }

  private getComparableProductFieldValue(item: ProductListItem, field: string): string {
    const normalizedField = this.toKey(field).replace(/-/g, '');
    const productKey = this.filterFieldMap[normalizedField];

    if (!productKey) {
      return '';
    }

    return this.toKey(String(item[productKey] ?? ''));
  }

  private toKey(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
