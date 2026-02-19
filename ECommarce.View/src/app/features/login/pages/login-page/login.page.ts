import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, take } from 'rxjs';

import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.page.html',
})
export class LoginPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: false,
  });

  isPasswordVisible = false;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (this.authState.getSessionSnapshot()) {
      void this.router.navigateByUrl('/admin/dashboard');
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
    this.errorMessage = '';

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authState
      .login(email, password, rememberMe)
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (session) => {
          void this.router.navigateByUrl('/admin/dashboard');
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Invalid credentials';
        },
      });
  }
}
