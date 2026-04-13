import { Injectable } from "@angular/core";
import { HttpContextToken } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";

export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);
export const SHOW_LOADING = new HttpContextToken<boolean>(() => false);

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private activeRequests = 0;
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingTimeout: any;

  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      // Smart loading: wait 250ms before showing spinner. 
      // If request completes before this (cached/fast), spinner never flickers.
      this.loadingTimeout = setTimeout(() => {
        this.loadingSubject.next(true);
      }, 250);
    }
  }

  hide(): void {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
      
      this.loadingSubject.next(false);
    }
  }
}
