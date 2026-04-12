import { Component, OnDestroy, OnInit, Inject, inject, PLATFORM_ID } from "@angular/core";
import { CommonModule, isPlatformBrowser, DOCUMENT } from "@angular/common";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

import {
  ProductCreatePayload,
  ProductUpdatePayload,
  AdminProduct,
} from "../../models/products.models";
import { ProductImage } from "../../../core/models/product";
import { ProductsService } from "../../services/products.service";
import { CategoriesService } from "../../services/categories.service";
import { Category } from "../../models/categories.models";
import { ImageUrlService } from "../../../core/services/image-url.service";
import {
  LucideAngularModule,
  ChevronRight,
  Check,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Upload,
  PlusCircle,
  Eye,
  Type,
  FileText,
  AlertCircle
} from "lucide-angular";

interface MediaFormValue {
  id: string;
  url: string;
  label: string;
  alt: string;
  type: "image" | "video";
  isMain: boolean;
  source: "file" | "url";
}

@Component({
  selector: "app-admin-product-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./admin-product-form.component.html",
})
export class AdminProductFormComponent implements OnDestroy, OnInit {
  readonly icons = {
    ChevronRight,
    Check,
    Bold,
    Italic,
    Underline,
    List,
    Link,
    Upload,
    PlusCircle,
    Eye,
    Type,
    FileText,
    AlertCircle
  };

  private formBuilder = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public imageUrlService = inject(ImageUrlService);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  isEditMode = false;
  productId: number | null = null;
  pageTitle = "Create Product";
  isSaving = false;

  categories: Category[] = [];
  mediaError = "";
  private mediaFileMap = new Map<string, File>();

  form = this.formBuilder.group({
    headline: ["", [Validators.required, Validators.minLength(3)]],
    slug: ["", [Validators.required, Validators.minLength(3)]],
    subtitle: ["", [Validators.required]],
    isActive: [true],
    category: ["", [Validators.required]],
    purchaseRate: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]],
    compareAtPrice: [null as number | null, [Validators.min(0)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    newArrival: [false],
    
    benefitsTitle: ["Key Benefits"],
    benefitsContent: [""],
    sideEffectsTitle: ["Side Effects"],
    sideEffectsContent: [""],
    usageTitle: ["How to Use"],
    usageContent: [""],

    mediaFiles: [[] as File[]],
    mediaItems: this.formBuilder.array([]),
  });

  constructor() {
    this.loadCategories();

    this.route.paramMap.subscribe((params) => {
      const id = params.get("id");
      if (id) {
        const parsedId = Number(id);
        if (Number.isFinite(parsedId)) {
          this.isEditMode = true;
          this.productId = parsedId;
          this.pageTitle = "Edit Product";
          this.loadProduct(this.productId);
        }
      }
    });

    // Auto-generate slug from headline if not manually edited
    this.form.get('headline')?.valueChanges.subscribe(val => {
      if (!this.isEditMode && val) {
        const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        this.form.get('slug')?.patchValue(slug, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    // Only in browser, only for admin form
    if (isPlatformBrowser(this.platformId)) {
      if (!this.document.getElementById("quill-css")) {
        const link = this.document.createElement("link");
        link.id = "quill-css";
        link.rel = "stylesheet";
        link.href = "/assets/quill.snow.css";
        this.document.head.appendChild(link);
      }
    }
  }

  loadCategories(): void {
    this.categoriesService.getAll().subscribe((categories) => {
      this.categories = categories;
    });
  }

  ngOnDestroy(): void {
    this.mediaItemsArray.controls.forEach((control) => {
      const value = control.value as MediaFormValue;
      if (value.source === "file") {
        URL.revokeObjectURL(value.url);
      }
    });
    this.mediaFileMap.clear();
  }

  get mediaItemsArray(): FormArray {
    return this.form.get("mediaItems") as FormArray;
  }

  loadProduct(productId: number): void {
    this.productsService.getProductById(productId).subscribe((product: AdminProduct) => {
      this.form.patchValue({
        headline: product.headline,
        slug: product.slug,
        subtitle: product.subtitle,
        isActive: product.isActive,
        category: product.categoryName || (product as any).category || "",

        purchaseRate: product.purchaseRate || 0,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stockQuantity: product.stockQuantity ?? 0,
        newArrival: product.isNew,
        benefitsTitle: product.benefitsTitle || "Key Benefits",
        benefitsContent: product.benefitsContent,
        sideEffectsTitle: product.sideEffectsTitle || "Side Effects",
        sideEffectsContent: product.sideEffectsContent,
        usageTitle: product.usageTitle || "How to Use",
        usageContent: product.usageContent,
      });

      // Load Media
      if (product.images && product.images.length > 0) {
        product.images.forEach((img, index) => {
          this.addMediaItem({
            url: img.imageUrl,
            source: "url",
            label: `Image ${index + 1}`,
            alt: img.altText || product.headline,
            type: "image",
            isMain: img.isPrimary,
          });
        });
      } else if (product.imgUrl) {
        this.addMediaItem({
          url: product.imgUrl,
          source: "url",
          label: "Main Image",
          alt: product.headline || "Product image",
          type: "image",
          isMain: true,
        });
      }
    });
  }

  handleFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.addFiles(Array.from(input.files));
    input.value = "";
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer?.files?.length) {
      return;
    }
    this.addFiles(Array.from(event.dataTransfer.files));
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  removeMediaItem(index: number): void {
    const control = this.mediaItemsArray.at(index);
    if (!control) {
      return;
    }
    const value = control.value as MediaFormValue;
    if (value.source === "file") {
      URL.revokeObjectURL(value.url);
      this.mediaFileMap.delete(value.id);
    }
    this.mediaItemsArray.removeAt(index);
    this.ensureMainMedia();
    this.syncMediaFiles();
  }

  setMainMedia(index: number): void {
    this.ensureSingleSelected(this.mediaItemsArray, "isMain", index);
  }

  applyFormatting(type: string, fieldName: string, textarea: HTMLTextAreaElement): void {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const fullText = textarea.value;

    let replacement = "";
    switch (type) {
      case "bold":
        replacement = `<b>${selectedText}</b>`;
        break;
      case "italic":
        replacement = `<i>${selectedText}</i>`;
        break;
      case "underline":
        replacement = `<u>${selectedText}</u>`;
        break;
      case "list":
        replacement = `\n<ul>\n  <li>${selectedText || "Item"}</li>\n</ul>`;
        break;
      case "link":
        let url: string | null = null;
        if (isPlatformBrowser(this.platformId)) {
          url = window.prompt("Enter URL", "https://");
        }
        if (url) {
          replacement = `<a href="${url}" class="text-primary hover:underline" target="_blank">${selectedText || "Link Text"}</a>`;
        } else {
          return;
        }
        break;
    }

    const newValue =
      fullText.substring(0, start) + replacement + fullText.substring(end);
    
    const patchObj: any = {};
    patchObj[fieldName] = newValue;
    this.form.patchValue(patchObj);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + replacement.length,
        start + replacement.length,
      );
    }, 0);
  }

  saveProduct(): void {
    this.mediaError = "";

    if (this.mediaItemsArray.length === 0) {
      this.mediaError = "Add at least one image or video for the product.";
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (isPlatformBrowser(this.platformId)) {
        window.alert("Please fill in all required fields correctly.");
      }
      return;
    }

    this.isSaving = true;
    const files = this.getSelectedFiles();

    this.productsService.uploadProductMedia(files).pipe(
      switchMap((uploadedUrls) => {
        const payload = this.buildPayload(uploadedUrls);
        if (this.isEditMode && this.productId !== null) {
          return this.productsService.updateProduct(this.productId, payload as ProductUpdatePayload);
        } else {
          return this.productsService.createProduct(payload as ProductCreatePayload);
        }
      })
    ).subscribe({
      next: () => {
        this.isSaving = false;
        const action = this.isEditMode ? "updated" : "created";
        if (isPlatformBrowser(this.platformId)) {
          window.alert(`Product ${action} successfully.`);
        }
        void this.router.navigate(["/admin/products"]);
      },
      error: (error) => {
        this.isSaving = false;
        console.error("Save error:", error);
        if (isPlatformBrowser(this.platformId)) {
          window.alert("Failed to save product. Please try again.");
        }
      }
    });
  }

  private buildPayload(uploadedUrls: string[]): ProductCreatePayload | ProductUpdatePayload {
    const raw = this.form.getRawValue();
    
    // Process media
    const allMediaItems = this.buildMediaItems(uploadedUrls);
    const mainMedia = allMediaItems.find(i => i.isMain) || allMediaItems[0];
    
    const images: ProductImage[] = allMediaItems.map((item, idx) => ({
      id: 0,
      imageUrl: item.url,
      altText: item.alt || raw.headline || undefined,
      isPrimary: item.isMain
    }));

    return {
      name: raw.headline ?? "",
      headline: raw.headline ?? "",
      slug: raw.slug ?? "",
      subtitle: raw.subtitle ?? "",
      isActive: Boolean(raw.isActive),
      category: raw.category ?? "",
      purchaseRate: Number(raw.purchaseRate),
      price: Number(raw.price),
      compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
      stockQuantity: Number(raw.stockQuantity) || 0,
      newArrival: Boolean(raw.newArrival),
      imgUrl: mainMedia?.url || "",
      images: images,
      benefitsTitle: raw.benefitsTitle ?? "",
      benefitsContent: raw.benefitsContent ?? "",
      sideEffectsTitle: raw.sideEffectsTitle ?? "",
      sideEffectsContent: raw.sideEffectsContent ?? "",
      usageTitle: raw.usageTitle ?? "",
      usageContent: raw.usageContent ?? "",
    };
  }

  private buildMediaItems(uploadedUrls: string[]): MediaFormValue[] {
    let fileIndex = 0;
    return this.mediaItemsArray.controls.map((control) => {
      const value = control.getRawValue() as MediaFormValue;
      if (value.source === "file") {
        const url = uploadedUrls[fileIndex] ?? value.url;
        fileIndex += 1;
        return { ...value, url };
      }
      return value;
    });
  }

  private addFiles(files: File[]): void {
    files.forEach((file) => {
      const id = this.generateId("media");
      const url = URL.createObjectURL(file);
      this.mediaFileMap.set(id, file);
      this.addMediaItem({
        id,
        url,
        label: this.titleize(file.name.replace(/\.[^.]+$/, "")) || "Gallery image",
        alt: this.form.get("headline")?.value || "Product image",
        type: "image",
        isMain: this.mediaItemsArray.length === 0,
        source: "file",
      });
    });
  }

  private addMediaItem(partial: Partial<MediaFormValue> & Pick<MediaFormValue, "url" | "source">): void {
    const item: MediaFormValue = {
      id: partial.id ?? this.generateId("media"),
      url: partial.url,
      label: partial.label ?? "Gallery image",
      alt: partial.alt ?? this.form.get("headline")?.value ?? "Product image",
      type: partial.type ?? "image",
      isMain: partial.isMain ?? this.mediaItemsArray.length === 0,
      source: partial.source,
    };
    this.mediaItemsArray.push(this.createMediaItemGroup(item));
    this.mediaError = "";
    this.ensureMainMedia();
    this.syncMediaFiles();
  }

  private createMediaItemGroup(item: MediaFormValue): AbstractControl {
    return this.formBuilder.group({
      id: [item.id],
      url: [item.url],
      label: [item.label],
      alt: [item.alt],
      type: [item.type],
      isMain: [item.isMain],
      source: [item.source],
    });
  }

  private ensureMainMedia(): void {
    const hasMain = this.mediaItemsArray.controls.some((control) => control.get("isMain")?.value);
    if (!hasMain && this.mediaItemsArray.length > 0) {
      this.mediaItemsArray.at(0)?.get("isMain")?.setValue(true);
    }
  }

  private ensureSingleSelected(array: FormArray, controlName: string, selectedIndex?: number): void {
    array.controls.forEach((control, index) => {
      control.get(controlName)?.setValue(selectedIndex === index, { emitEvent: false });
    });
    if (selectedIndex === undefined && array.length > 0) {
      array.at(0)?.get(controlName)?.setValue(true, { emitEvent: false });
    }
  }

  private syncMediaFiles(): void {
    this.form.patchValue({ mediaFiles: this.getSelectedFiles() });
  }

  private getSelectedFiles(): File[] {
    return Array.from(this.mediaFileMap.values());
  }

  private titleize(value: string): string {
    return value.split(/[-_ ]+/).map((segment) => segment ? segment[0].toUpperCase() + segment.slice(1) : "").join(" ").trim();
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
