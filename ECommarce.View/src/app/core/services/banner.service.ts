import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  buttonText: string;
  displayOrder: number;
}

@Injectable({
  providedIn: "root",
})
export class BannerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/banners`;

  getActiveBanners(): Observable<HeroBanner[]> {
    return this.http.get<HeroBanner[]>(this.apiUrl);
  }
}
