import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { QuillModule } from 'ngx-quill';
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AdminLandingPageService } from "../../services/admin-landing-page.service";
import { ProductsService } from "../../services/products.service";
import { AdminProduct } from "../../models/products.models";
import { LucideAngularModule, ArrowLeft, Save, Loader2, ImagePlus, Trash2 } from "lucide-angular";
import { ImageUrlService } from "../../../core/services/image-url.service";

@Component({
  selector: "app-admin-landing-page-editor",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule, QuillModule],
  templateUrl: "./admin-landing-page-editor.component.html"
})
export class AdminLandingPageEditorComponent implements OnInit {
  readonly icons = { ArrowLeft, Save, Loader2, ImagePlus, Trash2 };

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly landingPageService = inject(AdminLandingPageService);
  private readonly productsService = inject(ProductsService);
  public readonly imageUrlService = inject(ImageUrlService);

  productId!: number;
  product: AdminProduct | null = null;
  isLoading = false;
  isSaving = false;
  error = "";

  readonly form = this.fb.group({
    headline: ["", Validators.required],
    videoUrl: [""],
    subtitle: [""],
    benefitsTitle: ["লুব্রিকেন্ট জেল ব্যবহারের সুবিধাঃ"],
    benefitsContent: [""],
    reviewsTitle: ["কাস্টমার রিভিউ"],
    sideEffectsTitle: ["পার্শ্বপ্রতিক্রিয়াঃ"],
    sideEffectsContent: [""],
    usageTitle: ["ব্যবহারের নিয়মঃ"],
    usageContent: [""],
    themeColor: ["#1a1a1a"]
  });

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ]
  };

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
            subtitle: lp.subtitle,
            benefitsTitle: lp.benefitsTitle,
            benefitsContent: lp.benefitsContent,
            reviewsTitle: lp.reviewsTitle,
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
      subtitle: this.form.value.subtitle || null,
      benefitsTitle: this.form.value.benefitsTitle || null,
      benefitsContent: this.form.value.benefitsContent || null,
      reviewsTitle: this.form.value.reviewsTitle || null,
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
