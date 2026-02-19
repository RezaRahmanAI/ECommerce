import { Component } from "@angular/core";
import {
  LucideAngularModule,
  PenTool,
  CheckCircle2,
  Globe,
} from "lucide-angular";

@Component({
  selector: "app-why-choose-us",
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: "./why-choose-us.component.html",
  styleUrl: "./why-choose-us.component.css",
})
export class WhyChooseUsComponent {
  readonly icons = {
    PenTool,
    CheckCircle2,
    Globe,
  };
}
