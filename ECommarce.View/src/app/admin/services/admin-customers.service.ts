import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  deliveryDetails?: string;
  isSuspicious: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomersResponse {
  items: Customer[];
  total: number;
}

export interface CustomersQueryParams {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: "root",
})
export class AdminCustomersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin/customers`;

  getCustomers(params: CustomersQueryParams): Observable<CustomersResponse> {
    let httpParams = new HttpParams();

    if (params.searchTerm) {
      httpParams = httpParams.set("searchTerm", params.searchTerm);
    }
    if (params.page) {
      httpParams = httpParams.set("page", params.page);
    }
    if (params.pageSize) {
      httpParams = httpParams.set("pageSize", params.pageSize);
    }

    return this.http.get<CustomersResponse>(this.apiUrl, {
      params: httpParams,
    });
  }

  flagCustomer(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/flag`, {});
  }

  unflagCustomer(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/unflag`, {});
  }
}
