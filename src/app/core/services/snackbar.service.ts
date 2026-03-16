import { Injectable, signal } from '@angular/core';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarMessage {
  message: string;
  type: SnackbarType;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private _snackbar = signal<SnackbarMessage | null>(null);
  snackbar$ = this._snackbar.asReadonly();
  private _avoidBottomRight = signal(false);
  avoidBottomRight$ = this._avoidBottomRight.asReadonly();
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  show(
    message: string,
    type: SnackbarType = 'info',
    duration = 4000
  ) {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }

    this._snackbar.set({ message, type, duration });

    this.clearTimer = setTimeout(() => {
      this.clear();
    }, duration);
  }

  clear() {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    this._snackbar.set(null);
  }

  setAvoidBottomRight(value: boolean) {
    this._avoidBottomRight.set(value);
  }
}
