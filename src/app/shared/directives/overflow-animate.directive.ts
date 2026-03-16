import { AfterViewInit, Directive, ElementRef, HostBinding, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appOverflowAnimate]',
  standalone: true
})
export class OverflowAnimateDirective implements AfterViewInit, OnDestroy {
  @HostBinding('class.animate') isOverflowing = false;

  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.updateOverflowState();

    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateOverflowState();
      });

      this.resizeObserver.observe(this.elementRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private updateOverflowState(): void {
    const element = this.elementRef.nativeElement;
    const overflowing = element.scrollWidth > element.clientWidth;

    this.ngZone.run(() => {
      this.isOverflowing = overflowing;
    });
  }
}
