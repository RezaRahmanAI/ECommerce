import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface NavigationMenuItem {
  id: number;
  name: string;
  link: string;
  parentMenuId?: number | null;
  displayOrder: number;
  isActive: boolean;
  childMenus?: NavigationMenuItem[];
}

@Injectable({
  providedIn: "root",
})
export class AdminNavigationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin/navigation`;

  getAll(): Observable<NavigationMenuItem[]> {
    return this.http.get<NavigationMenuItem[]>(this.apiUrl);
  }

  getById(id: number): Observable<NavigationMenuItem> {
    return this.http.get<NavigationMenuItem>(`${this.apiUrl}/${id}`);
  }

  create(menu: Partial<NavigationMenuItem>): Observable<NavigationMenuItem> {
    return this.http.post<NavigationMenuItem>(this.apiUrl, menu);
  }

  update(
    id: number,
    menu: Partial<NavigationMenuItem>,
  ): Observable<NavigationMenuItem> {
    return this.http.put<NavigationMenuItem>(`${this.apiUrl}/${id}`, menu);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
