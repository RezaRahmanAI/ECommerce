import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppIconComponent } from "../app-icon/app-icon.component";

@Component({
  selector: "app-icon-button",
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: "./icon-button.component.html",
  styleUrl: "./icon-button.component.css",
})
export class IconButtonComponent {
  @Input() iconName: string = 'ShoppingCart';
  @Input() variant: "light" | "dark" = "light";
}
