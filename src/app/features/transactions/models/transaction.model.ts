export type TransactionPrintAction = 'order' | 'invoice' | 'receipt';

export interface TransactionItem {
  typeDocument: string;
  number: string;
  date: string;
  customerdni: string;
  customer: string;
  valor: number;
  linkInvoice: string;
  cufe: string;
  linkDian: string;
}
