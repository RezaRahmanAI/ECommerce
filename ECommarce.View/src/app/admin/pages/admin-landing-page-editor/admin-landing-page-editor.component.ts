import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AdminLandingPageService } from "../../services/admin-landing-page.service";
import { ProductsService } from "../../services/products.service";
import { AdminProduct } from "../../models/products.models";
import { LucideAngularModule, ArrowLeft, Save, Loader2, ImagePlus } from "lucide-angular";

@Component({
  selector: "app-admin-landing-page-editor",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: "./admin-landing-page-editor.component.html"
})
export class AdminLandingPageEditorComponent implements OnInit {
  readonly icons = { ArrowLeft, Save, Loader2, ImagePlus };

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly landingPageService = inject(AdminLandingPageService);
  private readonly productsService = inject(ProductsService);

  productId!: number;
  product: AdminProduct | null = null;
  isLoading = false;
  isSaving = false;
  error = "";

  readonly form = this.fb.group({
    headline: ["", Validators.required],
    videoUrl: [""],
    benefitsTitle: ["লুব্রিকেন্ট জেল ব্যবহারের সুবিধাঃ"],
    benefitsContent: [""],
    reviewsTitle: ["কাস্টমার রিভিউ"],
    reviewsImages: [""],
    sideEffectsTitle: ["পার্শ্বপ্রতিক্রিয়াঃ"],
    sideEffectsContent: [""],
    usageTitle: ["ব্যবহারের নিয়মঃ"],
    usageContent: [""],
    themeColor: ["#1a1a1a"]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.productId = +id;
      this.loadData();
    }
  }

  private loadData(): void {
    this.isLoading = true;
    
    // Load Product details (optional, just for display)
    this.productsService.getProductById(this.productId).subscribe({
      next: (p: any) => this.product = p,
      error: () => console.error("Could not load product")
    });

    // Load Landing Page
    this.landingPageService.getLandingPage(this.productId).subscribe({
      next: (lp: any) => {
        if (lp) {
          this.form.patchValue({
            headline: lp.headline,
            videoUrl: lp.videoUrl,
            benefitsTitle: lp.benefitsTitle,
            benefitsContent: lp.benefitsContent,
            reviewsTitle: lp.reviewsTitle,
            reviewsImages: lp.reviewsImages,
            sideEffectsTitle: lp.sideEffectsTitle,
            sideEffectsContent: lp.sideEffectsContent,
            usageTitle: lp.usageTitle,
            usageContent: lp.usageContent,
            themeColor: lp.themeColor
          });
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        if (err.status !== 404) {
          this.error = "Failed to load landing page.";
        }
        this.isLoading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = "";

    const payload = {
      productId: this.productId,
      headline: this.form.value.headline || "",
      videoUrl: this.form.value.videoUrl || null,
      benefitsTitle: this.form.value.benefitsTitle || null,
      benefitsContent: this.form.value.benefitsContent || null,
      reviewsTitle: this.form.value.reviewsTitle || null,
      reviewsImages: this.form.value.reviewsImages || null,
      sideEffectsTitle: this.form.value.sideEffectsTitle || null,
      sideEffectsContent: this.form.value.sideEffectsContent || null,
      usageTitle: this.form.value.usageTitle || null,
      usageContent: this.form.value.usageContent || null,
      themeColor: this.form.value.themeColor || null
    };

    this.landingPageService.saveLandingPage(payload as any).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(["/admin/products"]);
      },
      error: () => {
        this.error = "Failed to save landing page.";
        this.isSaving = false;
      }
    });
  }
}
