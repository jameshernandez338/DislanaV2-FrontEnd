import { Pipe, PipeTransform } from '@angular/core';
import { NumberFormatService } from '@shared/services/number-format.service';

@Pipe({
  name: 'appNumber',
  standalone: true
})
export class AppNumberPipe implements PipeTransform {
  constructor(private numberFormatService: NumberFormatService) {}

  transform(
    value: number | null | undefined,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  ): string {
    return this.numberFormatService.formatNumber(value ?? 0, {
      minimumFractionDigits,
      maximumFractionDigits
    });
  }
}
