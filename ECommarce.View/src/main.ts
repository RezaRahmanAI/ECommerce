import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient, withInterceptors } from "@angular/common/http";

import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";
import { API_CONFIG, ApiConfig } from "./app/core/config/api.config";
import { authTokenInterceptor } from "./app/core/http/auth-token.interceptor";
import { globalErrorInterceptor } from "./app/core/http/global-error.interceptor";
import { environment } from "./environments/environment";

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
    provideHttpClient(
      withInterceptors([authTokenInterceptor, globalErrorInterceptor]),
    ),
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.apiBaseUrl,
      },
    },
  ],
}).catch((err) => console.error(err));
