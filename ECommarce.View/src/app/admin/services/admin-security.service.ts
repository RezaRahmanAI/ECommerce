import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface BlockedIp {
  id: number;
  ipAddress: string;
  reason?: string;
  blockedAt: string;
  blockedBy?: string;
}

@Injectable({
  providedIn: "root",
})
export class AdminSecurityService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin/security`;

  getBlockedIps(): Observable<BlockedIp[]> {
    return this.http.get<BlockedIp[]>(`${this.apiUrl}/blocked-ips`);
  }

  blockIp(blockedIp: Partial<BlockedIp>): Observable<BlockedIp> {
    return this.http.post<BlockedIp>(`${this.apiUrl}/block-ip`, blockedIp);
  }

  unblockIp(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/unblock-ip/${id}`);
  }
}
