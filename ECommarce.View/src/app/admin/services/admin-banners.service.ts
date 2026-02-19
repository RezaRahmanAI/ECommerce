import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  buttonText: string;
  displayOrder: number;
  isActive: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AdminBannersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin/banners`;

  getAll(): Observable<Banner[]> {
    return this.http.get<Banner[]>(this.apiUrl);
  }

  getById(id: number): Observable<Banner> {
    return this.http.get<Banner>(`${this.apiUrl}/${id}`);
  }

  create(banner: Partial<Banner>): Observable<Banner> {
    return this.http.post<Banner>(this.apiUrl, banner);
  }

  update(id: number, banner: Partial<Banner>): Observable<Banner> {
    return this.http.put<Banner>(`${this.apiUrl}/${id}`, banner);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/image`, formData);
  }
}
