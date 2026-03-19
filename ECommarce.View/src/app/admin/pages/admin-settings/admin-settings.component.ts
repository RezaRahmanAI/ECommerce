import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from "@angular/core";
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterModule } from "@angular/router";

import {
  AdminSettings,
  ShippingZone,
  DeliveryMethod,
} from "../../models/settings.models";
import { SettingsService } from "../../services/settings.service";
import { ImageUrlService } from "../../../core/services/image-url.service";
import {
  LucideAngularModule,
  Save,
  Image,
  Edit,
  Upload,
  Copy,
  Plus,
  Trash2,
  X,
} from "lucide-angular";

@Component({
  selector: "app-admin-settings",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: "./admin-settings.component.html",
  styleUrl: "./admin-settings.component.css",
})
export class AdminSettingsComponent implements OnInit {
  readonly icons = {
    Save,
    Image,
    Edit,
    Upload,
    Copy,
    Plus,
    Trash2,
    X,
  };
  private formBuilder = inject(NonNullableFormBuilder);
  private settingsService = inject(SettingsService);

  @ViewChild("fileUpload") fileUpload?: ElementRef<HTMLInputElement>;

  tabs = ["General", "Shipping"];
  activeTab = "General";

  settingsForm = this.formBuilder.group({
    websiteName: ["", Validators.required],
    logoUrl: [""],
    contactEmail: ["", [Validators.email]],
    contactPhone: [""],
    facebookUrl: [""],
    instagramUrl: [""],
    twitterUrl: [""],
    youtubeUrl: [""],
    whatsAppNumber: [""],
    freeShippingThreshold: [0, Validators.required],
    facebookPixelId: [""],
    googleTagId: [""],
  });

  zoneForm = this.formBuilder.group({
    id: [0],
    name: ["", Validators.required],
    region: ["", Validators.required],
    rates: ["", Validators.required],
  });

  shippingZones: ShippingZone[] = [];
  deliveryMethods: DeliveryMethod[] = [];
  stripePublishableKey = "";
  logoPreviewUrl: string | null = null;
  logoError = "";
  saveMessage = "";
  isSaveError = false;

  showZoneForm = false;
  editingZoneId: number | null = null;

  showDeliveryForm = false;
  editingDeliveryId: number | null = null;
  deliveryForm = this.formBuilder.group({
    id: [0],
    name: ["", Validators.required],
    cost: [0, [Validators.required, Validators.min(0)]],
    estimatedDays: [""],
    isActive: [true],
  });

  copiedKey = false;
  imageUrlService = inject(ImageUrlService);

  private lastSettings: AdminSettings | null = null;
  protected Math = Math;
  protected date = new Date();

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe((settings) => {
      this.lastSettings = settings;
      this.shippingZones = settings.shippingZones || [];
      this.deliveryMethods = settings.deliveryMethods || [];
      this.stripePublishableKey = settings.stripePublishableKey || "";

      if (settings.logoUrl) {
        this.logoPreviewUrl = this.imageUrlService.getImageUrl(
          settings.logoUrl,
        );
      }

      this.settingsForm.patchValue({
        websiteName: settings.websiteName,
        logoUrl: settings.logoUrl,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
        twitterUrl: settings.twitterUrl,
        youtubeUrl: settings.youtubeUrl,
        whatsAppNumber: settings.whatsAppNumber,
        freeShippingThreshold: settings.freeShippingThreshold,
        facebookPixelId: settings.facebookPixelId,
        googleTagId: settings.googleTagId,
      });
    });
  }

  get stripeEnabled(): boolean {
    return !!this.lastSettings?.stripeEnabled;
  }

  get paypalEnabled(): boolean {
    return !!this.lastSettings?.paypalEnabled;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  saveChanges(): void {
    this.saveMessage = "";
    this.isSaveError = false;

    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const formValue = this.settingsForm.getRawValue();
    const payload: AdminSettings = {
      websiteName: formValue.websiteName,
      logoUrl: formValue.logoUrl,
      contactEmail: formValue.contactEmail,
      contactPhone: formValue.contactPhone,
      facebookUrl: formValue.facebookUrl,
      instagramUrl: formValue.instagramUrl,
      twitterUrl: formValue.twitterUrl,
      youtubeUrl: formValue.youtubeUrl,
      whatsAppNumber: formValue.whatsAppNumber,
      freeShippingThreshold: formValue.freeShippingThreshold,
      stripeEnabled: this.lastSettings?.stripeEnabled,
      paypalEnabled: this.lastSettings?.paypalEnabled,
      stripePublishableKey: this.stripePublishableKey,
      shippingZones: [...this.shippingZones],
      deliveryMethods: [...this.deliveryMethods],
      facebookPixelId: formValue.facebookPixelId,
      googleTagId: formValue.googleTagId,
    };

    this.settingsService.saveSettings(payload).subscribe({
      next: (settings) => {
        this.saveMessage = "Settings saved successfully.";
        this.isSaveError = false;
        this.lastSettings = settings;
        this.shippingZones = settings.shippingZones || [];
        this.deliveryMethods = settings.deliveryMethods || [];
      },
      error: (err) => {
        console.error("Failed to save settings", err);
        this.saveMessage = "Failed to save settings. Please try again.";
        this.isSaveError = true;
      },
    });
  }

  resetForm(): void {
    if (!this.lastSettings) {
      return;
    }

    this.settingsForm.reset({
      websiteName: this.lastSettings.websiteName,
      logoUrl: this.lastSettings.logoUrl,
      contactEmail: this.lastSettings.contactEmail,
      contactPhone: this.lastSettings.contactPhone,
      facebookUrl: this.lastSettings.facebookUrl,
      instagramUrl: this.lastSettings.instagramUrl,
      twitterUrl: this.lastSettings.twitterUrl,
      youtubeUrl: this.lastSettings.youtubeUrl,
      whatsAppNumber: this.lastSettings.whatsAppNumber,
      freeShippingThreshold: this.lastSettings.freeShippingThreshold,
      facebookPixelId: this.lastSettings.facebookPixelId,
      googleTagId: this.lastSettings.googleTagId,
    });

    this.shippingZones = this.lastSettings.shippingZones || [];
    this.deliveryMethods = this.lastSettings.deliveryMethods || [];
    this.stripePublishableKey = this.lastSettings.stripePublishableKey || "";
    this.saveMessage = "";
  }

  triggerLogoUpload(): void {
    this.fileUpload?.nativeElement.click();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const isValidType = ["image/png", "image/jpeg", "image/gif"].includes(
      file.type,
    );
    const isValidSize = file.size <= 2 * 1024 * 1024;

    if (!isValidType || !isValidSize) {
      this.logoError = "Please upload a PNG, JPG, or GIF file up to 2MB.";
      this.logoPreviewUrl = null;
      input.value = "";
      return;
    }

    this.logoError = "";

    // Upload immediately
    this.settingsService.uploadLogo(file).subscribe({
      next: (res) => {
        if (this.lastSettings) {
          this.lastSettings.logoUrl = res.url;
        }
        this.settingsForm.patchValue({ logoUrl: res.url });
        this.logoPreviewUrl = this.imageUrlService.getImageUrl(res.url);
      },
      error: (err) => {
        console.error("Logo upload failed", err);
        this.logoError = "Failed to upload logo.";
      },
    });
  }

  copyStripeKey(): void {
    if (!this.stripePublishableKey) {
      return;
    }

    navigator.clipboard.writeText(this.stripePublishableKey).then(() => {
      this.copiedKey = true;
      setTimeout(() => {
        this.copiedKey = false;
      }, 2000);
    });
  }

  startAddZone(): void {
    this.showZoneForm = true;
    this.editingZoneId = null;
    this.zoneForm.reset({ id: 0, name: "", region: "", rates: "" });
  }

  editZone(zone: ShippingZone): void {
    this.showZoneForm = true;
    this.editingZoneId = zone.id;
    this.zoneForm.reset({
      id: zone.id,
      name: zone.name,
      region: zone.region,
      rates: zone.rates.join(", "),
    });
  }

  saveZone(): void {
    if (this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();
      return;
    }

    const formValue = this.zoneForm.getRawValue();
    const updatedZone: ShippingZone = {
      id: formValue.id ?? 0,
      name: formValue.name,
      region: formValue.region,
      rates: formValue.rates
        .split(",")
        .map((rate) => rate.trim())
        .filter(Boolean),
    };

    if (this.editingZoneId) {
      this.settingsService
        .updateShippingZone(this.editingZoneId, updatedZone)
        .subscribe((zone) => {
          this.shippingZones = this.shippingZones.map((item) =>
            item.id === zone.id ? zone : item,
          );
          this.zoneForm.reset({ id: 0, name: "", region: "", rates: "" });
          this.showZoneForm = false;
          this.editingZoneId = null;
        });
      return;
    }

    this.settingsService.createShippingZone(updatedZone).subscribe((zone) => {
      this.shippingZones = [...this.shippingZones, zone];
      this.zoneForm.reset({ id: 0, name: "", region: "", rates: "" });
      this.showZoneForm = false;
      this.editingZoneId = null;
    });
  }

  cancelZoneEdit(): void {
    this.zoneForm.reset({ id: 0, name: "", region: "", rates: "" });
    this.showZoneForm = false;
    this.editingZoneId = null;
  }

  deleteZone(zone: ShippingZone): void {
    if (!confirm(`Delete the ${zone.name} zone?`)) {
      return;
    }

    this.settingsService.deleteShippingZone(zone.id).subscribe((success) => {
      if (!success) {
        return;
      }
      this.shippingZones = this.shippingZones.filter(
        (item) => item.id !== zone.id,
      );
    });
  }

  // Delivery Methods Methods
  startAddDelivery(): void {
    this.showDeliveryForm = true;
    this.editingDeliveryId = null;
    this.deliveryForm.reset({
      id: 0,
      name: "",
      cost: 0,
      estimatedDays: "",
      isActive: true,
    });
  }

  editDelivery(method: DeliveryMethod): void {
    this.showDeliveryForm = true;
    this.editingDeliveryId = method.id;
    this.deliveryForm.reset({
      id: method.id,
      name: method.name,
      cost: method.cost,
      estimatedDays: method.estimatedDays,
      isActive: method.isActive,
    });
  }

  saveDelivery(): void {
    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    const formValue = this.deliveryForm.getRawValue();
    const payload: Partial<DeliveryMethod> = {
      id: formValue.id ?? 0,
      name: formValue.name,
      cost: formValue.cost,
      estimatedDays: formValue.estimatedDays || undefined,
      isActive: formValue.isActive,
    };

    if (this.editingDeliveryId) {
      this.settingsService
        .updateDeliveryMethod(this.editingDeliveryId, payload)
        .subscribe(() => {
          this.deliveryMethods = this.deliveryMethods.map((m) =>
            m.id === this.editingDeliveryId
              ? ({ ...m, ...payload } as DeliveryMethod)
              : m,
          );
          this.closeDeliveryForm();
        });
    } else {
      this.settingsService
        .createDeliveryMethod(payload)
        .subscribe((newMethod) => {
          this.deliveryMethods = [...this.deliveryMethods, newMethod];
          this.closeDeliveryForm();
        });
    }
  }

  closeDeliveryForm(): void {
    this.showDeliveryForm = false;
    this.editingDeliveryId = null;
    this.deliveryForm.reset({
      id: 0,
      name: "",
      cost: 0,
      estimatedDays: "",
      isActive: true,
    });
  }

  deleteDelivery(method: DeliveryMethod): void {
    if (!confirm(`Delete the "${method.name}" delivery method?`)) {
      return;
    }

    this.settingsService.deleteDeliveryMethod(method.id).subscribe(() => {
      this.deliveryMethods = this.deliveryMethods.filter(
        (m) => m.id !== method.id,
      );
    });
  }

  rateClass(rate: string): string {
    if (rate.toLowerCase().includes("free shipping")) {
      return "px-2 py-1 bg-accent/30 text-primary text-xs rounded-md font-medium";
    }

    return "px-2 py-1 bg-gray-100 text-text-secondary text-xs rounded-md font-medium";
  }
}
