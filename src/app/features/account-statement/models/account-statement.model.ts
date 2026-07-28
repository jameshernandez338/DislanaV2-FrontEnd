export interface AccountStatementItem {
  documentDate: string;
  dueDate: string;
  documentNumber: string;
  value: number;
  balance: number;
  documentType: string;
  type: string;
}

export interface AccountStatementDetailDto {
  date: string;
  documentNumber: string;
  value: number;
  documentType: string;
}
