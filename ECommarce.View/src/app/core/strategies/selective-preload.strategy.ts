import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  private platformId = inject(PLATFORM_ID);

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Never preload on server (SSR)
    if (!isPlatformBrowser(this.platformId)) return of(null);
    
    // Only preload routes marked with data.preload = true
    // And wait 4 seconds after app boots so images/API load first
    if (route.data?.['preload'] === true) {
      return timer(4000).pipe(switchMap(() => load()));
    }
    return of(null);
  }
}
