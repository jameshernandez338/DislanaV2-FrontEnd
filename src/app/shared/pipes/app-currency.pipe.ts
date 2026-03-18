import { Pipe, PipeTransform } from '@angular/core';
import { NumberFormatService } from '@shared/services/number-format.service';

@Pipe({
  name: 'appCurrency',
  standalone: true
})
export class AppCurrencyPipe implements PipeTransform {
  constructor(private numberFormatService: NumberFormatService) {}

  transform(
    value: number | null | undefined,
    currency = 'COP',
    maximumFractionDigits = 0
  ): string {
    return this.numberFormatService.formatCurrency(value ?? 0, currency, {
      maximumFractionDigits
    });
  }
}
