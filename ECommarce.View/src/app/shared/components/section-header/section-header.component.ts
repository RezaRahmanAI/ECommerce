import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.css',
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() linkLabel = 'View All';
  @Input() linkUrl = '#';
}
