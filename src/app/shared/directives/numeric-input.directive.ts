import { Directive, ElementRef, HostListener, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appNumericInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumericInputDirective),
      multi: true
    }
  ]
})
export class NumericInputDirective implements ControlValueAccessor {
  @Input('appNumericInput') decimals = 0;
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLInputElement>) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isShortcutKey(event) || this.isNavigationKey(event.key)) {
      return;
    }

    const isDecimalSeparator = (event.key === ',' || event.key === '.') && this.allowedDecimals > 0;

    if (!/^\d$/.test(event.key) && !isDecimalSeparator) {
      event.preventDefault();
      return;
    }

    if (event.key === '.') {
      event.preventDefault();

      const input = this.elementRef.nativeElement;
      const selectionStart = input.selectionStart ?? input.value.length;
      const selectionEnd = input.selectionEnd ?? input.value.length;

      input.setRangeText(',', selectionStart, selectionEnd, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));

      return;
    }

    if (!this.isNextValueValid(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';
    const sanitizedText = this.sanitizePastedValue(pastedText);

    event.preventDefault();

    if (!sanitizedText) {
      return;
    }

    const input = this.elementRef.nativeElement;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? input.value.length;

    input.setRangeText(sanitizedText, selectionStart, selectionEnd, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;
    const sanitizedValue = this.sanitizeValue(input.value ?? '');

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }

    this.onChange(this.parseValue(sanitizedValue));
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | string | null): void {
    this.elementRef.nativeElement.value = this.formatValue(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  private get allowedDecimals(): number {
    const parsed = Number(this.decimals);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  }

  private getNormalizedValue(): string {
    return this.sanitizeValue(this.elementRef.nativeElement.value ?? '');
  }

  private sanitizePastedValue(value: string): string {
    const currentNormalizedValue = this.getNormalizedValue();
    const currentHasSeparator = currentNormalizedValue.includes(',');
    const sanitizedValue = this.sanitizeValue(value);

    if (!currentHasSeparator) {
      return sanitizedValue;
    }

    return sanitizedValue.replace(/,/g, '');
  }

  private isNextValueValid(key: string): boolean {
    const input = this.elementRef.nativeElement;
    const currentValue = input.value ?? '';
    const selectionStart = input.selectionStart ?? currentValue.length;
    const selectionEnd = input.selectionEnd ?? currentValue.length;
    const normalizedValue = this.sanitizeValue(currentValue);
    const normalizedSelectionStart = this.getNormalizedSelectionIndex(currentValue, selectionStart);
    const normalizedSelectionEnd = this.getNormalizedSelectionIndex(currentValue, selectionEnd);
    const nextValue = `${normalizedValue.slice(0, normalizedSelectionStart)}${key}${normalizedValue.slice(normalizedSelectionEnd)}`;

    return this.isValueValid(nextValue);
  }

  private getNormalizedSelectionIndex(value: string, selectionIndex: number): number {
    return this.sanitizeValue(value.slice(0, selectionIndex)).length;
  }

  private isValueValid(value: string): boolean {
    if (this.allowedDecimals === 0) {
      return /^\d*$/.test(value);
    }

    const decimalPattern = new RegExp(`^\\d*(,\\d{0,${this.allowedDecimals}})?$`);
    return decimalPattern.test(value);
  }

  private sanitizeValue(value: string): string {
    if (this.allowedDecimals === 0) {
      return value.replace(/\D/g, '');
    }

    const sanitizedValue = value
      .replace(/\./g, ',')
      .replace(/[^\d,]/g, '');

    if (!sanitizedValue) {
      return '';
    }

    const [integerPart, ...decimalParts] = sanitizedValue.split(',');
    const decimalPart = decimalParts.join('').slice(0, this.allowedDecimals);

    if (decimalParts.length === 0) {
      return integerPart;
    }

    return `${integerPart},${decimalPart}`;
  }

  private parseValue(value: string): number | null {
    if (!value) {
      return null;
    }

    const parsedValue = Number(value.replace(',', '.'));
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  private formatValue(value: number | string | null): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    if (typeof value === 'string') {
      return this.sanitizeValue(value);
    }

    return this.sanitizeValue(String(value).replace('.', ','));
  }

  private isNavigationKey(key: string): boolean {
    return ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(key);
  }

  private isShortcutKey(event: KeyboardEvent): boolean {
    return event.ctrlKey || event.metaKey || event.altKey;
  }
}
