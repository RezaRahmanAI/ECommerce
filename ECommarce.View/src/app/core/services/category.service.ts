import { Injectable, inject } from "@angular/core";
import { Observable, map, shareReplay } from "rxjs";

import { ApiHttpClient } from "../http/http-client";
import { Category } from "../models/category";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private readonly api = inject(ApiHttpClient);

  private categories$ = this.api.get<Category[]>("/categories").pipe(
    map((categories) =>
      categories
        .filter((category) => category.isActive)
        .map((category) => ({
          id: category.id,
          name: category.name,
          imageUrl: category.imageUrl ?? "",
          isActive: category.isActive,
        })),
    ),
    shareReplay(1),
  );

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }
}
