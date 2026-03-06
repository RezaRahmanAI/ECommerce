import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { Category } from "../../../../core/models/category";

@Component({
  selector: "app-category-section",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./category-section.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySectionComponent {
  @Input() title: string = "";
  @Input() viewAllLink: string = "/shop";
  @Input() categories: Category[] = [];

  constructor(public imageUrlService: ImageUrlService) {}

  trackByCategory(index: number, category: Category): number | string {
    return category.id;
  }
}
