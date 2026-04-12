import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ImageUrlService } from "../../../../core/services/image-url.service";

@Component({
  selector: "app-category-section",
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: "./category-section.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySectionComponent {
  @Input() title: string = "";
  @Input() viewAllLink: string = "/shop";
  @Input() categories: any[] = [];

  constructor(public imageUrlService: ImageUrlService) {}
}
