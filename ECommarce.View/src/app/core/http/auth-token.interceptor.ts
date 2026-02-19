import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_CONFIG, ApiConfig } from '../config/api.config';
import { AuthSessionService } from '../services/auth-session.service';

const getBasePath = (baseUrl: string): string => {
  try {
    return new URL(baseUrl).pathname.replace(/\/$/, '');
  } catch {
    return baseUrl.replace(/\/$/, '');
  }
};

const isApiRequest = (url: string, baseUrl: string): boolean => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const basePath = getBasePath(normalizedBaseUrl);

  if (url.startsWith('/')) {
    return url.startsWith(basePath);
  }

  return url.startsWith(normalizedBaseUrl);
};

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const sessionService = inject(AuthSessionService);
  const config = inject<ApiConfig>(API_CONFIG);
  const token = sessionService.getAccessToken();
  const baseUrl = config.baseUrl.replace(/\/$/, '');

  if (!token || !isApiRequest(request.url, baseUrl)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
