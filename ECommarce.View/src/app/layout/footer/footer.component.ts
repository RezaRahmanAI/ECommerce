import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SettingsService } from "../../admin/services/settings.service";
import { ImageUrlService } from "../../core/services/image-url.service";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./footer.component.html",
  styleUrl: "./footer.component.css",
})
export class FooterComponent implements OnInit {
  settingsService = inject(SettingsService);
  imageUrlService = inject(ImageUrlService);
  settings$ = this.settingsService.settings$;

  ngOnInit() {
    this.settingsService.getSettings().subscribe();
  }
}
