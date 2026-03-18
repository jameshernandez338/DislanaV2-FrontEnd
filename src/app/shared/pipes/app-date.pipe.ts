import { Pipe, PipeTransform } from '@angular/core';
import { NumberFormatService } from '@shared/services/number-format.service';

@Pipe({
  name: 'appDate',
  standalone: true
})
export class AppDatePipe implements PipeTransform {
  constructor(private numberFormatService: NumberFormatService) {}

  transform(value: string | Date | null | undefined): string {
    return this.numberFormatService.formatDate(value);
  }
}
