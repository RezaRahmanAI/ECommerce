import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";
import { ProductLandingPageDto, UpdateProductLandingPageDto } from "../models/landing-page.models";

@Injectable({ providedIn: "root" })
export class AdminLandingPageService {
  private readonly api = inject(ApiHttpClient);

  getLandingPage(productId: number): Observable<ProductLandingPageDto> {
    return this.api.get<ProductLandingPageDto>(`/landingpage/admin/${productId}`);
  }

  saveLandingPage(payload: UpdateProductLandingPageDto): Observable<ProductLandingPageDto> {
    return this.api.post<ProductLandingPageDto>("/landingpage/admin", payload);
  }

  uploadMedia(files: FileList): Observable<string[]> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    return this.api.post<string[]>("/landingpage/upload-media", formData);
  }
}
