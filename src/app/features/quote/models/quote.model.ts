export interface QuoteItem {
  documento: string;
  imagen: string;
  codigo: string;
  acabado: string;
  descripcion: string;
  calidad: string;
  linea: string;
  saldo: number;
  separados: number;
  cotizar?: boolean;
  cantidad: number;
  precioTotal: number;
}

export interface QuoteCustomerBalance {
  descuento: number;
  iva: number;
  reteFuente: number;
  reteIva: number;
  reteIca: number;
  cartera: number;
  apin: number;
  saldoAFavor: number;
  cupo: number;
  usaCupo: boolean;
}
