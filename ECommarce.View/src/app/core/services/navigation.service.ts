import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, shareReplay, map, catchError, of, startWith } from "rxjs";
import { environment } from "../../../environments/environment";

export interface MegaMenuItem {
  id: number;
  name: string;
  slug: string;
  subCategories: MegaMenuSubCategory[];
  isOpen?: boolean; // For mobile toggle
}

export interface MegaMenuSubCategory {
  id: number;
  name: string;
  slug: string;
  collections: MegaMenuCollection[];
}

export interface MegaMenuCollection {
  id: number;
  name: string;
  slug: string;
}

@Injectable({
  providedIn: "root",
})
export class NavigationService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiBaseUrl}/navigation`;

  private megaMenu$?: Observable<MegaMenuItem[]>;

  getMegaMenu(): Observable<MegaMenuItem[]> {
    if (!this.megaMenu$) {
      this.megaMenu$ = this.http.get<any>(`${this.API_URL}/mega-menu`).pipe(
        map((response) => response?.categories || response?.Categories || []),
        catchError((err) => {
          console.error("Mega menu failed to load:", err);
          return of([]);
        }),
        startWith([]),
        shareReplay(1),
      );
    }
    return this.megaMenu$;
  }
}
