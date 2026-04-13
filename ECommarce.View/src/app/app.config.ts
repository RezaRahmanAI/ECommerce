import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import {
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  withComponentInputBinding,
} from "@angular/router";
import { SelectivePreloadStrategy } from "./core/strategies/selective-preload.strategy";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import { provideClientHydration } from "@angular/platform-browser";


import { appRoutes } from "./app.routes";
import { API_CONFIG } from "./core/config/api.config";
import { environment } from "../environments/environment";
import { globalErrorInterceptor } from "./core/http/global-error.interceptor";
import { jwtInterceptor } from "./core/interceptors/jwt.interceptor";
import { loadingInterceptor } from "./core/interceptors/loading.interceptor";
import { httpCacheInterceptor } from "./interceptors/cache.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Only provide hydration if we are in production or if we specifically want it.
    // This avoids NG0505 warnings in CSR-only development mode.
    ...(environment.production ? [provideClientHydration()] : []),
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
        httpCacheInterceptor,
        jwtInterceptor,
        loadingInterceptor,
        globalErrorInterceptor,
      ]),
    ),
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.apiBaseUrl,
      },
    },
  ],
};
