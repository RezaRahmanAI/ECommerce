import { CommonModule } from "@angular/common";
import { QuillModule } from 'ngx-quill';
import { Component, OnDestroy, inject, ElementRef, ViewChild } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { switchMap } from "rxjs/operators";

import {
  ProductCreatePayload,
  AdminProduct,
} from "../../models/products.models";
import { ProductImage } from "../../../core/models/product";
import { ProductsService } from "../../services/products.service";
import { AdminLandingPageService } from "../../services/admin-landing-page.service";
import { CategoriesService } from "../../services/categories.service";
import {
  Category,
  SubCategory,
  Collection,
} from "../../models/categories.models";
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
  PlayCircle,
  PlusCircle,
  Eye,
  ImagePlus,
  Trash2
} from "lucide-angular";

interface MediaFormValue {
  id: string;
  url: string;
  label: string;
  alt: string;
  type: "image" | "video";
  isMain: boolean;
  source: "file" | "url";
  color?: string;
}

@Component({
  selector: "app-admin-product-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    QuillModule,
  ],
  templateUrl: "./admin-product-form.component.html",
})
export class AdminProductFormComponent implements OnDestroy {
  readonly icons = {
    ChevronRight,
    Check,
    Bold,
    Italic,
    Underline,
    List,
    Link,
    Upload,
    PlayCircle,
    PlusCircle,
    Eye,
    ImagePlus,
    Trash2
  };
  private formBuilder = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public imageUrlService = inject(ImageUrlService);
  private landingPageService = inject(AdminLandingPageService);

  // Mode detection
  isEditMode = false;
  productId: number | null = null;
  pageTitle = "Create Product";

  mediaError = "";
  private mediaFileMap = new Map<string, File>();
  reviewImagesList: string[] = [];

  @ViewChild("descriptionArea")
  descriptionArea!: ElementRef<HTMLTextAreaElement>;

  form = this.formBuilder.group(
    {
      name: ["", [Validators.required, Validators.minLength(3)]],
      statusActive: [true],
      category: ["", []],
      gender: ["women"],
      price: [0, [Validators.required, Validators.min(0)]],
      salePrice: [null as number | null, [Validators.min(0)]],
      purchaseRate: [0],

      isItemProduct: [true],
      mediaFiles: [[] as File[]],
      mediaItems: this.formBuilder.array([]),
      variants: this.formBuilder.group({
        colors: this.formBuilder.array([this.createColorGroup(true)]),
        sizes: this.formBuilder.array([this.createSizeGroup(true)]),
      }),
      landingPage: this.formBuilder.group({
        headline: [""],
        subtitle: [""],
        benefitsTitle: [""],
        benefitsContent: [""],
        reviewsTitle: [""],
        reviewsImages: [""],
        sideEffectsTitle: [""],
        sideEffectsContent: [""],
        usageTitle: [""],
        usageContent: [""],
      }),
    },
    { validators: [this.salePriceValidator] },
  );

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ]
  };

  categories: Category[] = [];
  filteredSubCategories: SubCategory[] = [];
  filteredCollections: Collection[] = [];

  constructor() {
    this.loadCategories(); // Load categories first

    // Detect edit mode from route params
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id");
      if (id) {
        const parsedId = Number(id);
        if (Number.isFinite(parsedId)) {
          this.isEditMode = true;
          this.productId = parsedId;
          this.pageTitle = "Edit Product";
          this.loadProduct(this.productId);
          this.loadLandingPage(this.productId);
        }
      }
    });
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

  get colorsArray(): FormArray {
    return this.form.get("variants.colors") as FormArray;
  }

  get sizesArray(): FormArray {
    return this.form.get("variants.sizes") as FormArray;
  }

  loadProduct(productId: number): void {
    this.productsService
      .getProductById(productId)
      .subscribe((product: AdminProduct) => {
        console.log("Admin Product Edit - Full Product Response:", product);

        // Populate form with product data
        // Pre-fill filtered lists based on product data BEFORE patching
        if (product.categoryId) {
          const category = this.categories.find(
            (c) => String(c.id) === String(product.categoryId),
          );
          this.filteredSubCategories = category?.subCategories || [];
        }
        if (product.subCategoryId) {
          const subCategory = this.filteredSubCategories.find(
            (sc) => String(sc.id) === String(product.subCategoryId),
          );
          this.filteredCollections = subCategory?.collections || [];
        }

        this.form.patchValue({
          name: product.name,
          statusActive: product.isActive,
          category: product.categoryId ? String(product.categoryId) : "",
          gender: "women",
          price: product.price,
          salePrice: product.compareAtPrice || null,
          purchaseRate: product.price,
          isItemProduct: product.isItemProduct || true,
        });

        // Load existing media
        // 1. Parse Variants First (Colors needed for Media Dropdowns)
        this.colorsArray.clear();
        const uniqueColors = new Set<string>();
        const images = (product as any).images || (product as any).Images || [];

        images.forEach((img: any) => {
          const color = img.color || img.Color;
          if (color) uniqueColors.add(color);
        });

        if (uniqueColors.size > 0) {
          uniqueColors.forEach((color) => {
            this.colorsArray.push(
              this.formBuilder.group({
                name: [color],
                selected: [true],
              }),
            );
          });
        } else {
          this.colorsArray.push(this.createColorGroup(true));
        }

        // 2. Sizes from Variants
        this.sizesArray.clear();
        const variants =
          (product as any).variants || (product as any).Variants || [];

        if (variants && variants.length > 0) {
          variants.forEach((v: any) => {
            this.sizesArray.push(
              this.formBuilder.group({
                label: [v.size || v.Size || ""],
                stock: [
                  v.stockQuantity || v.StockQuantity || 0,
                  [Validators.min(0)],
                ],
                selected: [true],
              }),
            );
          });
        } else {
          this.sizesArray.push(this.createSizeGroup(true));
        }

        // 3. Load Media
        // Load existing media with details
        if ((product as any).images && (product as any).images.length > 0) {
          (product as any).images.forEach((img: any, index: number) => {
            this.addMediaItem({
              url: img.imageUrl,
              source: "url",
              label: `Image ${index + 1}`,
              alt: img.altText || product.name,
              type: "image",
              isMain: img.isPrimary,
              color: img.color, // Now we have color!
            });
          });
        } else if (product.images && product.images.length > 0) {
          // Fallback for legacy (if any) or if typed as ProductImage[]
          product.images.forEach((img, index) => {
            this.addMediaItem({
              url: img.imageUrl,
              source: "url",
              label: `Image ${index + 1}`,
              alt: img.altText || product.name,
              type: "image",
              isMain: img.isPrimary,
              color: img.color,
            });
          });
        } else if (product.imageUrl) {
          this.addMediaItem({
            url: product.imageUrl,
            source: "url",
            label: "Main Image",
            alt: product.name || "Product image",
            type: "image",
            isMain: true,
          });
        }
      });
  }

  loadLandingPage(productId: number): void {
    this.reviewImagesList = []; // Reset before loading
    this.landingPageService.getLandingPage(productId).subscribe({
      next: (lp) => {
        this.form.get("landingPage")?.patchValue({
          headline: lp.headline ?? "",
          subtitle: lp.subtitle ?? "",
          benefitsTitle: lp.benefitsTitle ?? "",
          benefitsContent: lp.benefitsContent ?? "",
          reviewsTitle: lp.reviewsTitle ?? "",
          reviewsImages: lp.reviewsImages ?? "",
          sideEffectsTitle: lp.sideEffectsTitle ?? "",
          sideEffectsContent: lp.sideEffectsContent ?? "",
          usageTitle: lp.usageTitle ?? "",
          usageContent: lp.usageContent ?? "",
        });

        if (lp.reviewsImages) {
          try {
            if (lp.reviewsImages.startsWith("[") && lp.reviewsImages.endsWith("]")) {
              this.reviewImagesList = JSON.parse(lp.reviewsImages);
            } else if (lp.reviewsImages.trim()) {
              this.reviewImagesList = [lp.reviewsImages];
            }
          } catch {
            this.reviewImagesList = [];
          }
        }
      },
      error: () => console.log("No landing page found for this product yet."),
    });
  }

  onReviewFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.landingPageService.uploadMedia(files).subscribe({
        next: (urls) => {
          this.reviewImagesList = [...this.reviewImagesList, ...urls];
        },
        error: () => {
          window.alert("Failed to upload review images.");
        }
      });
    }
  }

  removeReviewImage(index: number): void {
    this.reviewImagesList.splice(index, 1);
  }

  addColor(): void {
    this.colorsArray.push(this.createColorGroup(false));
  }

  removeColor(index: number): void {
    if (this.colorsArray.length <= 1) {
      return;
    }
    const wasSelected = Boolean(
      this.colorsArray.at(index)?.get("selected")?.value,
    );
    this.colorsArray.removeAt(index);
    if (wasSelected) {
      this.ensureSingleSelected(this.colorsArray, "selected");
    }
  }

  setSelectedColor(index: number): void {
    this.ensureSingleSelected(this.colorsArray, "selected", index);
  }

  addSize(): void {
    this.sizesArray.push(this.createSizeGroup(false));
  }

  removeSize(index: number): void {
    if (this.sizesArray.length <= 1) {
      return;
    }
    const wasSelected = Boolean(
      this.sizesArray.at(index)?.get("selected")?.value,
    );
    this.sizesArray.removeAt(index);
    if (wasSelected) {
      this.ensureSingleSelected(this.sizesArray, "selected");
    }
  }

  setSelectedSize(index: number): void {
    this.ensureSingleSelected(this.sizesArray, "selected", index);
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

  addFromUrl(): void {
    const url = window.prompt("Enter media URL");
    if (!url) {
      return;
    }
    this.addMediaItem({
      url,
      source: "url",
    });
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

  discard(): void {
    const confirmed = window.confirm("Discard changes?");
    if (!confirmed) {
      return;
    }
    this.reviewImagesList = [];
    this.mediaItemsArray.clear();
    this.mediaFileMap.clear();
    this.resetForm();
    void this.router.navigate(["/admin/products"]);
  }

  saveProduct(): void {
    console.log("=== Save Product Started ===");
    this.mediaError = "";

    if (this.mediaItemsArray.length === 0) {
      this.mediaError = "Add at least one image or video for the product.";
      console.error("Validation failed: No media items");
    }

    if (this.form.invalid || this.mediaItemsArray.length === 0) {
      this.form.markAllAsTouched();

      // Log detailed validation errors
      const invalidFields: string[] = [];
      const formErrors = this.form.errors;
      
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control?.invalid) {
          invalidFields.push(key);
          console.error(`Field "${key}" is invalid:`, control.errors);
        }
      });

      console.error("Form validation failed", {
        formValid: this.form.valid,
        formErrors: formErrors,
        mediaCount: this.mediaItemsArray.length,
        invalidFields: invalidFields,
        formValue: this.form.value,
      });

      let alertMessage = "";
      if (invalidFields.length > 0) {
        alertMessage += `Please fill in all required fields: ${invalidFields.join(", ")}\n`;
      }
      if (formErrors) {
        if (formErrors['salePriceExceedsBase']) {
          alertMessage += `Validation Error: Discounted price cannot be higher than the main price.\n`;
        } else if (formErrors['salePriceTooLow']) {
           alertMessage += `Validation Error: Main price must be lower than the Compare at Price (to show a discount).\n`;
        } else {
          alertMessage += `Form Error: ${JSON.stringify(formErrors)}\n`;
        }
      }
      if (this.mediaItemsArray.length === 0) {
        alertMessage += `Media Error: Add at least one image or video for the product.\n`;
      }

      window.alert(alertMessage || "Please check the form for errors.");
      return;
    }

    const files = this.getSelectedFiles();
    console.log("Files to upload:", files.length);

    this.productsService
      .uploadProductMedia(files)
      .pipe(
        switchMap((mediaUrls) => {
          console.log("Media uploaded successfully:", mediaUrls);
          const payload = this.buildPayload(mediaUrls);

          // Use update or create based on mode
          if (this.isEditMode && this.productId !== null) {
            console.log("Updating product with payload:", payload);
            return this.productsService.updateProduct(
              this.productId,
              payload as any,
            );
          } else {
            console.log("Creating product with payload:", payload);
            return this.productsService.createProduct(payload);
          }
        }),
      )
      .subscribe({
        next: (product) => {
          const action = this.isEditMode ? "updated" : "created";
          console.log(`Product ${action} successfully:`, product);
          
          // If it's an Item Product, save landing page data
          if (this.form.get('isItemProduct')?.value) {
            const lpGroup = this.form.get('landingPage');
            const lpData = lpGroup?.value;
            this.landingPageService.saveLandingPage({
              productId: product.id,
              headline: lpData?.headline || "",
              subtitle: lpData?.subtitle ?? "",
              benefitsTitle: lpData?.benefitsTitle ?? "",
              benefitsContent: lpData?.benefitsContent ?? "",
              reviewsTitle: lpData?.reviewsTitle ?? "",
              reviewsImages: JSON.stringify(this.reviewImagesList),
              sideEffectsTitle: lpData?.sideEffectsTitle ?? "",
              sideEffectsContent: lpData?.sideEffectsContent ?? "",
              usageTitle: lpData?.usageTitle ?? "",
              usageContent: lpData?.usageContent ?? "",
              themeColor: "#e63b3b" // Default theme color
            }).subscribe({
              next: () => {
                window.alert(`Product and Landing Page ${action} successfully.`);
                void this.router.navigate(["/admin/products"]);
              },
              error: (err) => {
                console.error("Error saving landing page:", err);
                window.alert(`Product ${action} but Landing Page failed: ${err.message}`);
                void this.router.navigate(["/admin/products"]);
              }
            });
          } else {
            window.alert(`Product ${action} successfully.`);
            void this.router.navigate(["/admin/products"]);
          }
        },
        error: (error) => {
          const action = this.isEditMode ? "update" : "create";
          console.error(`Error ${action}ing product:`, error);
          const errorMessage =
            error?.error?.message ||
            error?.message ||
            `Failed to ${action} product. Please try again.`;
          window.alert(`Error: ${errorMessage}`);
        },
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private createColorGroup(selected: boolean): AbstractControl {
    return this.formBuilder.group({
      name: [""],
      selected: [true],
    });
  }

  private createSizeGroup(selected: boolean): AbstractControl {
    return this.formBuilder.group({
      label: [""],
      stock: [0, [Validators.min(0)]],
      selected: [true],
    });
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
      color: [item.color],
    });
  }

  private salePriceValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const basePrice = Number(control.get("price")?.value ?? 0);
    const salePriceControl = control.get("salePrice");
    const salePrice = salePriceControl?.value;
    
    // If no sale price (compare at price), it's valid
    if (salePrice === null || salePrice === undefined || salePrice === "" || salePrice === 0) {
      return null;
    }
    
    const saleValue = Number(salePrice);
    if (Number.isNaN(saleValue)) {
      return null;
    }

    // "Compare at Price" (saleValue) should be HIGHER than the current "Price" (basePrice)
    // If user sets SalePrice < Price, it's technically invalid for a discount display
    return saleValue < basePrice ? { salePriceTooLow: true } : null;
  }

  private addFiles(files: File[]): void {
    files.forEach((file) => {
      const id = this.generateId("media");
      const url = URL.createObjectURL(file);
      this.mediaFileMap.set(id, file);
      this.addMediaItem({
        id,
        url,
        label:
          this.titleize(file.name.replace(/\.[^.]+$/, "")) || "Gallery image",
        alt: this.form.get("name")?.value || "Product image",
        type: "image",
        isMain: this.mediaItemsArray.length === 0,
        source: "file",
      });
    });
  }

  private addMediaItem(
    partial: Partial<MediaFormValue> & Pick<MediaFormValue, "url" | "source">,
  ): void {
    const item: MediaFormValue = {
      id: partial.id ?? this.generateId("media"),
      url: partial.url,
      label: partial.label ?? "Gallery image",
      alt: partial.alt ?? this.form.get("name")?.value ?? "Product image",
      type: partial.type ?? "image",
      isMain: partial.isMain ?? this.mediaItemsArray.length === 0,
      source: partial.source,
      color: partial.color,
    };
    this.mediaItemsArray.push(this.createMediaItemGroup(item));
    this.mediaError = "";
    this.ensureMainMedia();
    this.syncMediaFiles();
  }

  private ensureMainMedia(): void {
    const hasMain = this.mediaItemsArray.controls.some(
      (control) => control.get("isMain")?.value,
    );
    if (!hasMain && this.mediaItemsArray.length > 0) {
      this.mediaItemsArray.at(0)?.get("isMain")?.setValue(true);
    }
  }

  private ensureSingleSelected(
    array: FormArray,
    controlName: string,
    selectedIndex?: number,
  ): void {
    array.controls.forEach((control, index) => {
      control
        .get(controlName)
        ?.setValue(selectedIndex === index, { emitEvent: false });
    });
    if (selectedIndex === undefined && array.length > 0) {
      array.at(0)?.get(controlName)?.setValue(true, { emitEvent: false });
    }
  }

  private syncMediaFiles(): void {
    const files = this.getSelectedFiles();
    this.form.patchValue({ mediaFiles: files });
  }

  private getSelectedFiles(): File[] {
    return Array.from(this.mediaFileMap.values());
  }

  private buildPayload(uploadedUrls: string[]): ProductCreatePayload {
    const raw = this.form.getRawValue();

    // 1. Handle Media (Main + Thumbnails)
    const mediaItems = this.buildMediaItems(uploadedUrls);
    const mainImageItem = mediaItems.find((i) => i.isMain) || mediaItems[0];
    const thumbnailItems = mediaItems.filter((i) => i !== mainImageItem);

    const mainImage = {
      type: mainImageItem?.type || "image",
      label: mainImageItem?.label || "Main Image",
      imageUrl: mainImageItem?.url || "",
      alt: mainImageItem?.alt || "",
      color: mainImageItem?.color || "",
    };

    const thumbnails = thumbnailItems.map((item) => ({
      type: item.type,
      label: item.label,
      imageUrl: item.url,
      alt: item.alt,
      color: item.color || "",
    }));

    // 2. Handle Variants (Definitions)
    const rawColors = this.colorsArray.getRawValue();
    const rawSizes = this.sizesArray.getRawValue();

    const colors = rawColors.map((c: any) => ({
      name: c.name,
      hex: "", // Hex not currently in form, could add later
      selected: true,
    }));

    const sizes = rawSizes.map((s: any) => ({
      label: s.label,
      stock: Number(s.stock),
      selected: true,
    }));

    // 3. Handle Inventory Variants (Specific SKUs)
    // NOW: Size-based only. No cross-multiplication with colors.
    const inventoryVariants: any[] = [];

    // We only care about sizes for stock. Colors are just tags.
    rawSizes.forEach((s: any) => {
      // If no size label, skip? Or allow empty size for "One Size"?
      // Let's assume label is required or defaults to "One Size" if empty?
      // For now, take label as is.
      const sizeLabel = s.label || "One Size";

      inventoryVariants.push({
        label: sizeLabel,
        price: Number(raw.price),
        sku: `${raw.name?.slice(0, 3)}-${sizeLabel}`
          .toUpperCase()
          .replace(/\s+/g, ""),
        inventory: Number(s.stock || 0),
        imageUrl: "",
      });
    });

    // 4. Resolve Category Name
    let categoryName = "";
    const selectedCategoryId = raw.category;
    
    if (selectedCategoryId) {
      const categoryObj = this.categories.find(
        (c) => String(c.id) === String(selectedCategoryId),
      );
      categoryName = categoryObj?.name || "";
    } else if (raw.isItemProduct && this.categories.length > 0) {
      // Fallback for Item Product if hidden category is not selected
      categoryName = this.categories[0].name;
    }

    return {
      name: raw.name ?? "",
      description: "",
      statusActive: Boolean(raw.statusActive),
      category: categoryName, // Send Name, not ID
      gender: raw.gender ?? "women",
      price: Number(raw.price ?? 0),
      salePrice:
        raw.salePrice !== null && raw.salePrice !== undefined
          ? Number(raw.salePrice)
          : undefined,

      purchaseRate: Number(raw.purchaseRate ?? 0),

      newArrival: false,
      isFeatured: false,
      isItemProduct: Boolean(raw.isItemProduct),

      media: {
        mainImage,
        thumbnails,
      },

      variants: {
        colors,
        sizes,
      },

      inventoryVariants,

      meta: {
        fabricAndCare: "",
        shippingAndReturns: "",
      },

      ratings: {
        average: 0,
        count: 0,
      },

      tier: "",
      tags: "",
      sortOrder: 0,
      subCategoryId: null,
      collectionId: null,
    };
    // but we want to match backend DTO structure primarily.
    // Actually the interface is updated, so it should be fine.
    // Removing 'as any' if possible to verify type safety.
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

  private mapToProductImage(item: MediaFormValue): ProductImage {
    return {
      id: 0,
      imageUrl: item.url,
      altText: item.alt || "Product image",
      isPrimary: item.isMain,
      color: item.color,
    };
  }

  private resetForm(): void {
    this.form.reset({
      name: "",
      statusActive: true,
      category: "",
      gender: "women",
      price: 0,
      salePrice: null,
      purchaseRate: 0,
      isItemProduct: true,
      mediaFiles: [],
      mediaItems: [],
      variants: {
        colors: [this.createColorGroup(true).value],
        sizes: [this.createSizeGroup(true).value],
      },
      landingPage: {
        headline: "",
        subtitle: "",
        benefitsTitle: "",
        benefitsContent: "",
        reviewsTitle: "",
        reviewsImages: "",
        sideEffectsTitle: "",
        sideEffectsContent: "",
        usageTitle: "",
        usageContent: "",
      },
    });
    this.mediaError = "";

    this.mediaItemsArray.controls.forEach((control) => {
      if (control.get("source")?.value === "file") {
        URL.revokeObjectURL(control.get("url")?.value);
      }
    });
    this.mediaItemsArray.clear();
    this.mediaFileMap.clear();

    while (this.colorsArray.length > 1) {
      this.colorsArray.removeAt(0, { emitEvent: false });
    }
    this.colorsArray
      .at(0)
      ?.patchValue({ name: "", hex: "#111827", selected: true });

    while (this.sizesArray.length > 1) {
      this.sizesArray.removeAt(0, { emitEvent: false });
    }
    this.sizesArray.at(0)?.patchValue({ label: "", stock: 0, selected: true });
  }

  private titleize(value: string): string {
    return value
      .split(/[-_ ]+/)
      .map((segment) =>
        segment ? segment[0].toUpperCase() + segment.slice(1) : "",
      )
      .join(" ")
      .trim();
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

}
