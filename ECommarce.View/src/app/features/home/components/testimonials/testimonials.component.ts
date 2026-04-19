import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, Input } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { ReviewService } from "../../../../core/services/review.service";
import { Review } from "../../../../core/models/review";
import { ImageUrlService } from "../../../../core/services/image-url.service";

import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-testimonials",
  standalone: true,
  imports: [CommonModule, AppIconComponent, NgOptimizedImage],
  templateUrl: "./testimonials.component.html",
  styleUrl: "./testimonials.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsComponent implements OnInit {
  // icons removed
  @Input() productId?: number;
  reviews: Review[] = [];
  stars = [1, 2, 3, 4, 5];

  private readonly reviewService = inject(ReviewService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly imageUrlService = inject(ImageUrlService);

  ngOnInit(): void {
    const obs = this.productId 
      ? this.reviewService.getReviewsByProductId(this.productId)
      : this.reviewService.getFeaturedReviews();

    obs.subscribe((reviews: Review[]) => {
      this.reviews = reviews;
      this.cdr.markForCheck();
    });
  }

  getStarIcon(rating: number, star: number): string {
    if (rating >= star) {
      return "Star";
    }

    if (rating + 0.5 >= star) {
      return "StarHalf";
    }

    return "Star";
  }
}
