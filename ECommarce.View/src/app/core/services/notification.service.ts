import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { BehaviorSubject, Observable } from "rxjs";

export interface ToastMessage {
  type: "SUCCESS" | "ERROR" | "INFO" | "WARNING";
  message: string;
  id: number;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  toast$ = this.toastSubject.asObservable();
  private counter = 0;
  private platformId = inject(PLATFORM_ID);

  constructor() {
  }

  success(message: string): void {
    this.show("SUCCESS", message);
    this.playSuccessSound();
  }

  error(message: string): void {
    this.show("ERROR", message);
  }

  info(message: string): void {
    this.show("INFO", message);
  }

  warn(message: string): void {
    this.show("WARNING", message);
  }

  private playSuccessSound(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        
        const context = new AudioContextClass();
        const now = context.currentTime;

        const playNote = (freq: number, start: number, duration: number) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
          
          osc.connect(gain);
          gain.connect(context.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        };

        // Elegant double-chime (E6 -> A6)
        playNote(1318.51, now, 0.4);
        playNote(1760.00, now + 0.08, 0.5);
      } catch (err) {
        console.warn('Digital chime failed:', err);
      }
    }
  }

  private show(
    type: "SUCCESS" | "ERROR" | "INFO" | "WARNING",
    message: string,
  ): void {
    console.log(`[${type}] ${message}`);
    this.toastSubject.next({ type, message, id: ++this.counter });

    // Auto-dismiss logic can be handled here or in the component.
    // For simplicity, we just emit the event.
  }
}
