import { CommonModule, NgOptimizedImage } from "@angular/common";
import { Component, OnInit, inject, ChangeDetectionStrategy } from "@angular/core";
import { RouterModule } from "@angular/router";
import { BannerService, HeroBanner } from "../../../../core/services/banner.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { map } from "rxjs";

@Component({
  selector: "app-promo-banner",
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: "./promo-banner.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoBannerComponent implements OnInit {
  private bannerService = inject(BannerService);
  imageUrlService = inject(ImageUrlService);

  promoBanner$ = this.bannerService.getActiveBanners().pipe(
    map((banners: HeroBanner[]) => banners.find(b => b.type === 'Promo'))
  );

  ngOnInit(): void {}
}
