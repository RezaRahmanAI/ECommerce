import { Component, OnDestroy, OnInit, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser, NgIf, NgFor, AsyncPipe, NgClass, NgStyle } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { Category } from "../../models/categories.models";
import { CategoriesService } from "../../services/categories.service";
import { environment } from "../../../../environments/environment";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-admin-category-management",
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    NgClass,
    NgStyle,
    ReactiveFormsModule,
    RouterModule,
    AppIconComponent,
  ],
  templateUrl: "./admin-category-management.component.html",
})
export class AdminCategoryManagementComponent implements OnInit, OnDestroy {
  // icons removed

  private categoriesService = inject(CategoriesService);
  private formBuilder = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  categories: Category[] = [];
  filteredCategories: Category[] = [];
  selectedId: number | null = null;
  mode: "create" | "edit" = "create";
  isLoading = false;
  filterControl = this.formBuilder.control("", { nonNullable: true });

  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isUploadingImage = false;

  categoryForm = this.formBuilder.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    imageUrl: [""],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.filterControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startCreate(): void {
    this.mode = "create";
    this.selectedId = null;
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.categoryForm.reset({
      name: "",
      imageUrl: "",
      isActive: true,
    });
  }

  selectCategory(category: Category): void {
    this.mode = "edit";
    this.selectedId = category.id;
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.categoryForm.reset({
      name: category.name,
      imageUrl: category.imageUrl ?? "",
      isActive: category.isActive,
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    if (this.selectedImageFile) {
      this.isUploadingImage = true;
      this.categoriesService.uploadImage(this.selectedImageFile).subscribe({
        next: (imageUrl) => {
          this.isUploadingImage = false;
          this.categoryForm.patchValue({ imageUrl });
          this.selectedImageFile = null;
          this.imagePreviewUrl = null;
          this.performSave();
        },
        error: () => {
          this.isUploadingImage = false;
          if (isPlatformBrowser(this.platformId)) {
            window.alert("Failed to upload image. Please try again.");
          }
        },
      });
      return;
    }

    this.performSave();
  }

  deleteCategory(category: Category): void {
    if (isPlatformBrowser(this.platformId)) {
      const confirmed = window.confirm(`Delete ${category.name}?`);
      if (!confirmed) {
        return;
      }

      this.categoriesService.delete(category.id).subscribe({
        next: () => {
          this.categories = this.categories.filter((item) => item.id !== category.id);
          this.applyFilter();
          if (this.selectedId === category.id) {
            this.startCreate();
          }
        },
        error: (err) => {
          const errorMsg = err.error?.message || "Failed to delete category.";
          if (isPlatformBrowser(this.platformId)) {
            window.alert(errorMsg);
          }
        },
      });
    }
  }

  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (!file.type.startsWith("image/")) {
      if (isPlatformBrowser(this.platformId)) {
        window.alert("Please select a valid image file.");
      }
      return;
    }

    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    const baseUrl = environment.apiBaseUrl.replace("/api", "");
    return `${baseUrl}${imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl}`;
  }

  getPreviewUrl(): string {
    if (this.imagePreviewUrl) {
      return this.imagePreviewUrl;
    }
    return this.getImageUrl(this.categoryForm.get("imageUrl")?.value);
  }

  private performSave(): void {
    const formValue = this.categoryForm.getRawValue();
    const payload = {
      name: formValue.name ?? "",
      imageUrl: formValue.imageUrl ?? "",
      isActive: formValue.isActive ?? true,
    };

    if (this.mode === "create") {
      this.categoriesService.create(payload).subscribe({
        next: (created) => {
          this.categories.unshift(created);
          this.applyFilter();
          this.selectCategory(created);
        },
        error: (error) => {
          const msg = error?.error?.message || "Failed to create category";
          if (isPlatformBrowser(this.platformId)) {
            window.alert(msg);
          }
        },
      });
      return;
    }

    if (!this.selectedId) {
      return;
    }

    this.categoriesService.update(this.selectedId, payload).subscribe({
      next: (updated) => {
        this.categories = this.categories.map((item) =>
          item.id === updated.id ? updated : item,
        );
        this.applyFilter();
        this.selectCategory(updated);
      },
      error: (error) => {
        const msg = error?.error?.message || "Failed to update category";
        if (isPlatformBrowser(this.platformId)) {
          window.alert(msg);
        }
      },
    });
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.categoriesService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private applyFilter(): void {
    const term = this.filterControl.value.trim().toLowerCase();
    if (!term) {
      this.filteredCategories = [...this.categories];
      return;
    }
    this.filteredCategories = this.categories.filter((category) =>
      category.name.toLowerCase().includes(term),
    );
  }
}
