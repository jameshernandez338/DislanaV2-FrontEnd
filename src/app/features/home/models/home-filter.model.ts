export interface ProductFilterItem {
  filtro: string;
  valor: string;
  campoVista: string;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  field: string;
  searchPlaceholder: string;
  options: FilterOption[];
}

export interface ProductStatusRow {
  documento: string;
  fecha: string;
  cantidad: number;
}

export interface ProductListItem {
  codigoItem: string;
  descripcionItem: string;
  imagen: string;
  pvp: number;
  disponible: number;
  departamento: string;
  ciudad: string;
  nombre: string;
  cts: string;
  tipo: string;
  acabado: string;
  categoria: string;
  atributo: string;
  color: string;
  detalle: string;
  separado: number;
  pendiente: number;
  pedidosPendientes?: ProductStatusRow[];
  pendientesPorFacturar?: ProductStatusRow[];
}
