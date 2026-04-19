import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import {
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  withComponentInputBinding,
} from "@angular/router";
import { SelectivePreloadStrategy } from "./core/strategies/selective-preload.strategy";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi, HTTP_INTERCEPTORS } from "@angular/common/http";


import { appRoutes } from "./app.routes";
import { API_CONFIG } from "./core/config/api.config";
import { environment } from "../environments/environment";
import { globalErrorInterceptor } from "./core/http/global-error.interceptor";
import { jwtInterceptor } from "./core/interceptors/jwt.interceptor";
import { loadingInterceptor } from "./core/interceptors/loading.interceptor";
import { httpCacheInterceptor } from "./core/interceptors/cache.interceptor";
import { adminCacheInterceptor } from "./core/interceptors/admin-cache.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
      withPreloading(SelectivePreloadStrategy),
      withComponentInputBinding(),
    ),

    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        jwtInterceptor,
        loadingInterceptor,
        globalErrorInterceptor,
        httpCacheInterceptor,
        adminCacheInterceptor,
      ]),
      withInterceptorsFromDi()
    ),
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.apiBaseUrl,
      },
    },
  ],
};
