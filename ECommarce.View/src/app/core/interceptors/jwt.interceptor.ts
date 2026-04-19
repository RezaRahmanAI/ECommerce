import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from "@angular/common/http";
import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { finalize, retry, timer } from "rxjs";
import { LoadingService } from "../services/loading.service";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const token = isBrowser ? localStorage.getItem("sherashop-token") : null;
  const isFormData = typeof FormData !== 'undefined' && req.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData && !req.headers.has("Content-Type")) {
    headers["Content-Type"] = "application/json";
  }

  return next(req.clone({ setHeaders: headers })).pipe(
    retry({
      count: 2,
      delay: (error, retryCount) => timer(retryCount * 1000),
    }),
  );
};

