import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { finalize, take } from "rxjs";

import { AuthService } from "../../../../core/services/auth.service";

import {
  LucideAngularModule,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-angular";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./login.page.html",
})
export class LoginPageComponent implements OnInit {
  readonly icons = {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
  };
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    rememberMe: false,
  });

  isPasswordVisible = false;
  isLoading = false;
  errorMessage = "";

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl("/admin/dashboard");
      return;
    }

    const savedEmail = localStorage.getItem("ecommarce-saved-email");
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        rememberMe: true,
      });
    }
  }

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  submit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService
      .login(email, password, rememberMe)
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (user) => {
          if (user) {
            if (rememberMe) {
              localStorage.setItem("ecommarce-saved-email", email);
            } else {
              localStorage.removeItem("ecommarce-saved-email");
            }
            void this.router.navigateByUrl("/admin/dashboard");
          } else {
            this.errorMessage = "Invalid credentials";
          }
        },
        error: () => {
          this.errorMessage = "Network or server error occurred";
        },
      });
  }
}
