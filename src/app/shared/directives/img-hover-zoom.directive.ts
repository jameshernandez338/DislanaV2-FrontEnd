import { DOCUMENT } from '@angular/common';
import { Directive, HostListener, Inject, Input, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appImgHoverZoom]',
  standalone: true
})
export class ImgHoverZoomDirective implements OnDestroy {
  @Input('appImgHoverZoom') imageSrc = '';

  private readonly container: HTMLDivElement;
  private readonly img: HTMLImageElement;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.container = this.document.createElement('div');
    this.img = this.document.createElement('img');
    this.setupElements();
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.imageSrc) {
      return;
    }

    this.img.src = this.imageSrc;
    this.container.style.display = 'flex';
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.container.style.display = 'none';
  }

  ngOnDestroy(): void {
    this.container.remove();
  }

  private setupElements() {
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.zIndex = '1050';
    this.container.style.display = 'none';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.pointerEvents = 'none';
    this.container.style.background = 'rgba(15, 23, 42, 0.12)';
    this.container.style.backdropFilter = 'blur(2px)';

    this.img.style.maxWidth = '80vw';
    this.img.style.maxHeight = '80vh';
    this.img.style.borderRadius = '12px';
    this.img.style.boxShadow = '0 24px 60px rgba(15, 23, 42, 0.28)';
    this.img.style.border = '1px solid rgba(255, 255, 255, 0.85)';
    this.img.style.background = '#fff';

    this.container.appendChild(this.img);
    this.document.body.appendChild(this.container);
  }
}
