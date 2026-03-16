export interface ProductDetailDto {
  product: ProductDto;
  features: FeatureDto[];
  similarProducts: SimilarProductDto[];
}

export interface ProductDto {
  codeItem: string;
  imagen: string;
  detalle: string;
  pvpDescuento: number;
  pvp: number;
  pvpB: number;
  calidad1: number;
  calidadB: number;
  pesoML: number;
  pesoGSM: number;
  ancho: number;
  descuento: number;
  cantidad1: number;
  cantidadB: number;
  fichaTecnica: string;
}

export interface FeatureDto {
  titulo: string;
  detalle: string;
}

export interface SimilarProductDto {
  codigoItem: string;
  imagen: string;
  descripcionItem: string;
  disponible: number;
  pvp: number;
  detalle: string;
}
