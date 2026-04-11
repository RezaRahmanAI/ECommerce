import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import * as signalR from "@microsoft/signalr";
import { Subject, Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
  private platformId = inject(PLATFORM_ID);
  
  private settingsUpdateSubject = new Subject<void>();
  private productUpdateSubject = new Subject<any>();
  private newOrderSubject = new Subject<any>();
  private orderStatusUpdateSubject = new Subject<any>();

  settingsUpdate$ = this.settingsUpdateSubject.asObservable();
  productUpdate$ = this.productUpdateSubject.asObservable();
  newOrder$ = this.newOrderSubject.asObservable();
  orderStatusUpdate$ = this.orderStatusUpdateSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.startConnection();
    }
  }

  private startConnection() {
    const hubUrl = `${environment.apiBaseUrl.replace("/api", "")}/hubs/notifications`;
    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log("[SignalR] Connection started");
        this.registerHandlers();
      })
      .catch((err) => console.log("[SignalR] Error while starting connection: " + err));
  }

  private registerHandlers() {
    this.hubConnection.on("ReceiveSettingsUpdate", () => {
      console.log("[SignalR] Received settings update notification");
      this.settingsUpdateSubject.next();
    });

    this.hubConnection.on("ReceiveProductUpdate", (data) => {
      console.log("[SignalR] Received product update notification:", data);
      this.productUpdateSubject.next(data);
    });

    this.hubConnection.on("ReceiveNewOrder", (data) => {
      console.log("[SignalR] Received new order notification:", data);
      this.newOrderSubject.next(data);
    });

    this.hubConnection.on("ReceiveOrderStatusUpdate", (data) => {
      console.log("[SignalR] Received order status update notification:", data);
      this.orderStatusUpdateSubject.next(data);
    });
  }
}
