import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<any>>();

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next.handle(req);
    }

    // Check if there's a cached response
    const cachedResponse = this.cache.get(req.urlWithParams);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // If not cached, make the request and cache the response
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.urlWithParams, event);
        }
      }),
    );
  }
}
