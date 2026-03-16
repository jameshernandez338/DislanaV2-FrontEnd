import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '@core/services/cart.service';
import { ProductService } from '@core/services/product.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { ProductDetailDto, SimilarProductDto } from '../../models/product-detail.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly visibleSimilarCount = 4;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private snackbarService: SnackbarService
  ) {}

  loading = false;
  currentSimilarIndex = 0;
  quantityA = 0;
  quantityB = 0;

  productDetail: ProductDetailDto | null = null;

  similarProducts: SimilarProductDto[] = [];

  get product() {
    return this.productDetail?.product ?? null;
  }

  get productReference(): string {
    return this.product?.codeItem || '';
  }

  get productImage(): string {
    return this.product?.imagen || '';
  }

  get productGallery(): string[] {
    return [this.productImage];
  }

  get productPrice(): string {
    return this.formatCurrency(this.product?.pvpDescuento ?? 0);
  }

  get productPreviousPrice(): string {
    return this.formatCurrency(this.product?.pvp ?? 0);
  }

  get productDiscount(): string {
    return `${this.product?.descuento ?? 0}%`;
  }

  get productMetrics() {
    return [
      { label: 'Peso ML', value: `${this.product?.pesoML ?? 0}` },
      { label: 'Peso GSM', value: `${this.product?.pesoGSM ?? 0}` },
      { label: 'Ancho', value: `${this.product?.ancho ?? 0}` }
    ];
  }

  get productDescription(): string {
    return this.product?.detalle || this.productReference;
  }

  get productAvailability(): string {
    return (this.product?.calidad1 ?? 0) > 0 || (this.product?.calidadB ?? 0) > 0
      ? 'Disponible'
      : 'Sin disponibilidad';
  }

  get productInventory() {
    return [
      { label: 'Calidad 1', value: `${this.product?.calidad1 ?? 0} Metros` },
      { label: 'Calidad B', value: `${this.product?.calidadB ?? 0} Metros`, tone: 'danger' as const }
    ];
  }

  get productQualityPrice(): string {
    return this.formatCurrency(this.product?.pvpB ?? 0);
  }

  get technicalSheetUrl(): string {
    return this.product?.fichaTecnica || '#';
  }

  get totalRequestedQuantity(): number {
    return (this.quantityA || 0) + (this.quantityB || 0);
  }

  get specifications() {
    return (this.productDetail?.features ?? []).map((feature) => ({
      label: feature.titulo,
      value: feature.detalle
    }));
  }

  get visibleSimilarProducts(): SimilarProductDto[] {
    return this.similarProducts.slice(this.currentSimilarIndex, this.currentSimilarIndex + this.visibleSimilarCount);
  }

  get canGoBack(): boolean {
    return this.currentSimilarIndex > 0;
  }

  get canGoForward(): boolean {
    return this.currentSimilarIndex + this.visibleSimilarCount < this.similarProducts.length;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const routeId = params.get('id');
        if (!routeId) {
          return;
        }

        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }

        this.loadProductDetail(routeId);
      });
  }

  selectImage(image: string) {
    if (!this.product) {
      return;
    }

    this.product.imagen = image;
  }

  previousSimilar() {
    if (!this.canGoBack) {
      return;
    }

    this.currentSimilarIndex -= 1;
  }

  nextSimilar() {
    if (!this.canGoForward) {
      return;
    }

    this.currentSimilarIndex += 1;
  }

  getProductImage(item: SimilarProductDto): string {
    return item.imagen || '/images/categories/school.png';
  }

  getProductPrice(item: SimilarProductDto): string {
    if (item.pvp === undefined) {
      return 'Pvp';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(item.pvp);
  }

  getProductRoute(item: SimilarProductDto): string[] {
    return ['/productos', item.codigoItem || item.descripcionItem || item.detalle || 'producto'];
  }

  addToCart() {
    if (!this.product) {
      return;
    }

    if (this.totalRequestedQuantity === 0) {
      this.snackbarService.show('Debes ingresar una cantidad para pedir el producto.', 'warning');
      return;
    }

    const totalA = (this.quantityA || 0) * (this.product.pvpDescuento || 0);
    const totalB = (this.quantityB || 0) * (this.product.pvpB || 0);
    const total = totalA + totalB;

    this.cartService.addItem({
      id: this.product.codeItem,
      codigoItem: this.product.codeItem,
      name: this.product.codeItem,
      image: this.product.imagen,
      quantityA: this.quantityA || 0,
      quantityB: this.quantityB || 0,
      unitPriceA: this.product.pvpDescuento || 0,
      unitPriceB: this.product.pvpB || 0,
      unitPriceALabel: `Valor x metro: ${this.formatCurrency(this.product.pvpDescuento || 0)}`,
      unitPriceBLabel: `Valor x metro: ${this.formatCurrency(this.product.pvpB || 0)}`,
      qualityA: `Calidad 1: ${this.quantityA || 0} mtrs. Valor: ${this.formatCurrency(totalA)}`,
      qualityB: `Calidad B: ${this.quantityB || 0} mtrs. Valor: ${this.formatCurrency(totalB)}`,
      price: this.formatCurrency(total),
      total
    });

    this.snackbarService.show('Producto agregado al carrito.', 'success');
    this.quantityA = 0;
    this.quantityB = 0;
  }

  private loadProductDetail(codigoItem: string) {
    this.loading = true;
    this.currentSimilarIndex = 0;

    this.productService.getProductDetail(codigoItem)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (detail) => {
          this.productDetail = detail;
          this.quantityA = detail.product.cantidad1 ?? 0;
          this.quantityB = detail.product.cantidadB ?? 0;
          this.similarProducts = detail.similarProducts;
        },
        error: () => {
          this.productDetail = null;
          this.quantityA = 0;
          this.quantityB = 0;
          this.similarProducts = [];
        }
      });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value || 0);
  }
}
