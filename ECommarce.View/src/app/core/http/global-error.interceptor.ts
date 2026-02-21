import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { Router } from "@angular/router";

import { NotificationService } from "../services/notification.service";

/**
 * Global Error Interceptor
 * Handles all API errors (400, 401, 403, 404, 500) consistently.
 */
export const globalErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const notificationService = inject(NotificationService);

  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error) {
        switch (error.status) {
          case 400:
            if (error.error?.errors) {
              // Handle validation errors
              const modelStateErrors = [];
              for (const key in error.error.errors) {
                if (error.error.errors[key]) {
                  modelStateErrors.push(error.error.errors[key]);
                }
              }
              notificationService.error(
                modelStateErrors.flat().join("\n") ||
                  "Validation error occurred",
              );
              throw modelStateErrors.flat();
            } else {
              notificationService.error(error.error?.message || "Bad Request");
            }
            break;

          case 401:
            notificationService.error("Session expired. Please login again.");
            void router.navigate(["/login"]);
            break;

          case 403: {
            const message =
              error.error?.message ||
              (typeof error.error === "string" ? error.error : null) ||
              "You do not have permission to perform this action";
            notificationService.error(message);
            break;
          }

          case 404:
            // Skip notification for customer lookup (new customer scenario)
            if (request.url.includes("/customers/lookup")) {
              break;
            }
            // Optional: don't notify on 404 if the UI handles it
            notificationService.error("Resource not found");
            break;

          case 500:
            notificationService.error(
              "A server error occurred. Our engineers have been notified.",
            );
            break;

          default:
            notificationService.error("An unexpected error occurred");
            console.error("Unhandled API Error:", error);
            break;
        }
      }
      return throwError(() => error);
    }),
  );
};
