import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core";
import { isPlatformServer } from "@angular/common";
import { Observable, map, shareReplay, of, tap } from "rxjs";

import { ApiHttpClient } from "../http/http-client";
import { Category } from "../models/category";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private readonly api = inject(ApiHttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  
  private readonly CATEGORIES_KEY = makeStateKey<Category[]>("categories_data");

  getCategories(): Observable<Category[]> {
    const isServer = isPlatformServer(this.platformId);

    if (this.transferState.hasKey(this.CATEGORIES_KEY)) {
      return of(this.transferState.get(this.CATEGORIES_KEY, []));
    }

    return this.api.get<Category[]>("/categories").pipe(
      map((categories) =>
        categories
          .filter((category) => category.isActive)
          .map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            imageUrl: category.imageUrl ?? "",
            isActive: category.isActive,
          })),
      ),
      tap(data => {
        if (isServer) {
          this.transferState.set(this.CATEGORIES_KEY, data);
        }
      }),
      shareReplay(1),
    );
  }
}
