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

export interface QuoteCustomerTaxes {
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

export interface QuoteCustomerBalanceDetail {
  observacion: string;
  tipo: string;
  numero: string;
  fecha: string;
  valor: number;
}

export interface PaymentItem {
  Tipo: string;
  Documento: string;
  Item: string;
  Cantidad: number;
  Valor: number;
}

export interface PaymentRequest {
  ValorTotal: number;
  Items: PaymentItem[];
}

export interface WompiPayment {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  signature: string;
  redirectUrl: string;
  urlBase: string;
}

export interface PaymentResponse {
  message: string;
  amount: number;
}
