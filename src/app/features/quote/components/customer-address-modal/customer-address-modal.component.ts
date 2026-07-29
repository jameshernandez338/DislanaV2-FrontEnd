import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { QuoteService } from '@core/services/quote.service';
import { CustomerAddressDto } from '../../models/quote.model';

@Component({
  selector: 'app-customer-address-modal',
  imports: [LucideAngularModule],
  templateUrl: './customer-address-modal.component.html'
})
export class CustomerAddressModalComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  @Input() show = false;
  @Output() addressSelected = new EventEmitter<CustomerAddressDto>();
  @Output() cancelled = new EventEmitter<void>();

  loading = false;
  loadFailed = false;
  addresses: CustomerAddressDto[] = [];
  selectedAddress: CustomerAddressDto | null = null;
  icons = { X };

  constructor(private quoteService: QuoteService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']?.currentValue === true) {
      this.selectedAddress = null;
      this.loadAddresses();
    }
  }

  selectAddress(address: CustomerAddressDto): void {
    this.selectedAddress = address;
  }

  confirm(): void {
    if (!this.selectedAddress) {
      return;
    }
    this.addressSelected.emit(this.selectedAddress);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private loadAddresses(): void {
    this.loading = true;
    this.loadFailed = false;
    this.addresses = [];

    this.quoteService.getCustomerAddresses()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (addresses) => {
          this.addresses = addresses;
        },
        error: () => {
          this.loadFailed = true;
        }
      });
  }
}
