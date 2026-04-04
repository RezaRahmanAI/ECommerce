import { Injectable, inject } from "@angular/core";
import { Observable, map, shareReplay } from "rxjs";

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

  // Cache categories — they rarely change during a session
  private categories$ = this.api.get<any[]>("/categories").pipe(
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
          childCategories:
            category.childCategories?.map((child: any) => ({
              id: child.id.toString(),
              name: child.name,
              slug: child.slug,
              href: `/shop/${category.slug}/${child.slug}`,
              imageUrl:
                child.imageUrl ??
                "assets/images/placeholder-" + child.slug + ".jpg",
            })) || [],
        })),
    ),
    shareReplay(1),
  );

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }
}
