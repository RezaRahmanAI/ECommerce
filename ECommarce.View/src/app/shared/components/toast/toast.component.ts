import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NotificationService,
  ToastMessage,
} from "../../../core/services/notification.service";
import {
  animate,
  style,
  transition,
  trigger,
  state,
} from "@angular/animations";

@Component({
  selector: "app-toast",
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger("toastAnimation", [
      state("void", style({ transform: "translateY(20px)", opacity: 0 })),
      state("*", style({ transform: "translateY(0)", opacity: 1 })),
      transition("void => *", animate("300ms cubic-bezier(0.2, 0, 0, 1)")),
      transition(
        "* => void",
        animate(
          "300ms ease-out",
          style({ opacity: 0, transform: "translateY(10px)" }),
        ),
      ),
    ]),
  ],
  template: `
    <div
      class="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-[100] flex flex-col gap-3 pointer-events-none sm:max-w-md sm:w-full"
    >
      <div
        *ngFor="let toast of toasts"
        @toastAnimation
        class="pointer-events-auto w-full border rounded-xl p-4 shadow-2xl shadow-black/10 flex items-start gap-4 transition-all"
        [ngClass]="{
          'bg-accent text-white border-accent': toast.type === 'SUCCESS',
          'bg-white/95 text-gray-900 border-gray-100 backdrop-blur-md': toast.type !== 'SUCCESS'
        }"
      >
        <!-- Icon -->
        <div 
          class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          [ngClass]="{
            'bg-white/20 text-white': toast.type === 'SUCCESS',
            'bg-red-50 text-red-600': toast.type === 'ERROR',
            'bg-blue-50 text-blue-600': toast.type === 'INFO',
            'bg-yellow-50 text-yellow-600': toast.type === 'WARNING'
          }"
        >
          <svg *ngIf="toast.type === 'SUCCESS'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          <svg *ngIf="toast.type === 'ERROR'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <svg *ngIf="toast.type === 'INFO' || toast.type === 'WARNING'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>

        <div class="flex-1 min-w-0 pt-1">
          <p 
            class="text-sm font-bold leading-tight"
            [ngClass]="{'text-white': toast.type === 'SUCCESS', 'text-gray-900': toast.type !== 'SUCCESS'}"
          >
            {{ toast.type === 'SUCCESS' ? 'Success' : toast.type === 'ERROR' ? 'Alert' : 'Information' }}
          </p>
          <p 
            class="text-sm mt-1 leading-relaxed"
            [ngClass]="{'text-white/90': toast.type === 'SUCCESS', 'text-gray-500': toast.type !== 'SUCCESS'}"
          >
            {{ toast.message }}
          </p>
        </div>

        <button
          (click)="remove(toast.id)"
          class="flex-shrink-0 p-1 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `,
})
export class ToastComponent implements OnInit {
  notificationService = inject(NotificationService);
  toasts: ToastMessage[] = [];

  ngOnInit() {
    this.notificationService.toast$.subscribe((toast) => {
      if (toast) {
        this.add(toast);
      }
    });
  }

  add(toast: ToastMessage) {
    this.toasts.push(toast);
    setTimeout(() => this.remove(toast.id), 4000); // Auto remove after 4s
  }

  remove(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}
