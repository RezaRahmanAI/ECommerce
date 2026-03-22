import { bootstrapApplication, provideClientHydration, withEventReplay } from "@angular/platform-browser";
import {
  provideRouter,
  withInMemoryScrolling,
} from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from "@angular/common/http";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";

import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";
import { API_CONFIG, ApiConfig } from "./app/core/config/api.config";

import { globalErrorInterceptor } from "./app/core/http/global-error.interceptor";
import { environment } from "./environments/environment";

import { jwtInterceptor } from "./app/core/interceptors/jwt.interceptor";
import { loadingInterceptor } from "./app/core/interceptors/loading.interceptor";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
    ),
    provideAnimations(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
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
    provideCharts(withDefaultRegisterables()),
  ],
}).catch((err) => console.error(err));
