import { Component, OnDestroy, OnInit, inject, PLATFORM_ID } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AdminReview } from "../../models/reviews.models";
import { AdminReviewsService } from "../../services/admin-reviews.service";
import { ProductsService } from "../../services/products.service";
import { AdminProduct } from "../../models/products.models";
import {
  LucideAngularModule,
  Star,
  User,
  CheckCircle2,
  ShoppingBag,
  ThumbsUp,
  Edit,
  Trash2,
  X,
  MessageSquare,
  Plus,
  Camera,
  Upload,
} from "lucide-angular";

@Component({
  selector: "app-admin-reviews",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: "./admin-reviews.component.html",
})
export class AdminReviewsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Star,
    User,
    CheckCircle2,
    ShoppingBag,
    ThumbsUp,
    Edit,
    Trash2,
    X,
    MessageSquare,
    Plus,
    Camera,
    Upload,
  };
  private reviewsService = inject(AdminReviewsService);
  private productsService = inject(ProductsService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  reviews: AdminReview[] = [];
  products: AdminProduct[] = [];
  isModalOpen = false;
  isEditMode = false;
  selectedReviewId: number | null = null;
  isSubmitting = false;
  isUploadingAvatar = false;

  reviewForm = this.fb.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    customerName: ["", [Validators.required]],
    customerAvatar: [""],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ["", [Validators.required]],
    isVerifiedPurchase: [true],
    isFeatured: [false],
  });

  ngOnInit(): void {
    this.loadReviews();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReviews(): void {
    this.reviewsService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((reviews) => {
        this.reviews = reviews;
      });
  }

  loadProducts(): void {
    this.productsService
      .getProducts({
        page: 1,
        pageSize: 100,
        searchTerm: "",
        category: "",
        statusTab: "Active",
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        this.products = response.items;
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploadingAvatar = true;
    this.reviewsService.uploadAvatar(file).subscribe({
      next: (urls) => {
        if (urls && urls.length > 0) {
          this.reviewForm.patchValue({ customerAvatar: urls[0] });
        }
        this.isUploadingAvatar = false;
      },
      error: () => (this.isUploadingAvatar = false),
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedReviewId = null;
    this.reviewForm.reset({
      productId: 0,
      customerName: "",
      customerAvatar: "",
      rating: 5,
      comment: "",
      isVerifiedPurchase: true,
      isFeatured: false,
    });
    this.isModalOpen = true;
  }

  openEditModal(review: AdminReview): void {
    this.isEditMode = true;
    this.selectedReviewId = review.id;
    this.reviewForm.patchValue({
      productId: review.productId,
      customerName: review.customerName,
      customerAvatar: review.customerAvatar,
      rating: review.rating,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isFeatured: review.isFeatured,
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const reviewData = this.reviewForm.value as any;

    const request = this.isEditMode && this.selectedReviewId
      ? this.reviewsService.update(this.selectedReviewId, reviewData)
      : this.reviewsService.create(reviewData);

    request.subscribe({
      next: () => {
        this.loadReviews();
        this.closeModal();
        this.isSubmitting = false;
      },
      error: () => (this.isSubmitting = false),
    });
  }

  deleteReview(id: number): void {
    if (isPlatformBrowser(this.platformId)) {
      if (confirm("Are you sure you want to delete this review?")) {
        this.reviewsService.delete(id).subscribe(() => {
          this.loadReviews();
        });
      }
    }
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
