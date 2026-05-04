import { Injectable, signal } from "@angular/core";

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const DEFAULT_ZOOM = 100;

@Injectable({ providedIn: "root" })
export class ZoomService {
  readonly zoom = signal(DEFAULT_ZOOM);

  setZoom(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }

    const normalized = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value)));
    this.zoom.set(normalized);
  }

  resetZoom(): void {
    this.zoom.set(DEFAULT_ZOOM);
  }
}
