import { Inject, Injectable, LOCALE_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NumberFormatService {
  constructor(@Inject(LOCALE_ID) private localeId: string) {}

  formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(this.localeId, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(value ?? 0);
  }

  formatCurrency(
    value: number,
    currency = 'COP',
    options: Intl.NumberFormatOptions = {}
  ): string {
    return new Intl.NumberFormat(this.localeId, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      ...options
    }).format(value ?? 0);
  }

  formatDate(
    value: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  ): string {
    if (!value) {
      return '';
    }

    const parsedDate = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      const normalizedValue = String(value).split('T')[0];
      const parts = normalizedValue.split(/[-/]/);

      if (parts.length === 3) {
        const [year, month, day] = parts;

        if (year.length === 4) {
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }

      return String(value);
    }

    return new Intl.DateTimeFormat(this.localeId, options).format(parsedDate);
  }
}
