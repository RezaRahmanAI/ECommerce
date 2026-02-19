import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";

import { ApiHttpClient } from "../http/http-client";
import { Category } from "../models/category";

type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
  displayOrder: number;
};

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private readonly api = inject(ApiHttpClient);

  getCategories(): Observable<Category[]> {
    return this.api.get<any[]>("/categories").pipe(
      map((categories) =>
        categories
          .filter((category) => category.isActive)
          .sort((first, second) => first.displayOrder - second.displayOrder)
          .map((category) => ({
            id: category.id.toString(),
            name: category.name,
            slug: category.slug,
            description: category.description,
            imageUrl: category.imageUrl ?? "",
            href: category.slug ? `/shop/${category.slug}` : "/shop",
            productCount: category.productCount,
            subCategories:
              category.subCategories?.map((sub: any) => ({
                id: sub.id.toString(),
                name: sub.name,
                slug: sub.slug,
                href: `/shop/${category.slug}/${sub.slug}`,
                imageUrl:
                  sub.imageUrl ??
                  "assets/images/placeholder-" + sub.slug + ".jpg", // Fallback or dynamic
              })) || [],
          })),
      ),
    );
  }
}
