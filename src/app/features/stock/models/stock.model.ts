export interface CommittedStockItem {
  grupo: string;
  documento: string;
  fecha: string;
  cantidad: number;
}

export interface InventoryStatementItem {
  grupo: string;
  documento: string;
  fecha: string;
  item: string;
  descripcion: string;
  cantidad: number;
  saldoPendiente: number;
  calidadLote: string;
  precioTotal: number;
  imagen: string;
}
