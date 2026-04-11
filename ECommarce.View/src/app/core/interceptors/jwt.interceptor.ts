import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from "@angular/common/http";
import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { finalize, retry, timer } from "rxjs";
import { LoadingService } from "../services/loading.service";

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const platformId = inject(PLATFORM_ID);
  
  let token: string | null = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem("sherashop-token");
  }
  
  const isFormData = req.body instanceof FormData;

  loading.show();

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
    finalize(() => loading.hide()),
  );
};

