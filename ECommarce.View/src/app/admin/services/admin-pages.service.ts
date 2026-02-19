import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface StaticPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AdminPagesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin/pages`;

  getAll(): Observable<StaticPage[]> {
    return this.http.get<StaticPage[]>(this.apiUrl);
  }

  getById(id: number): Observable<StaticPage> {
    return this.http.get<StaticPage>(`${this.apiUrl}/${id}`);
  }

  create(page: Partial<StaticPage>): Observable<StaticPage> {
    return this.http.post<StaticPage>(this.apiUrl, page);
  }

  update(id: number, page: Partial<StaticPage>): Observable<StaticPage> {
    return this.http.put<StaticPage>(`${this.apiUrl}/${id}`, page);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
