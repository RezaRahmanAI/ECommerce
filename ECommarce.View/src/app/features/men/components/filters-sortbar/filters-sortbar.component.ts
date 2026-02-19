import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-men-filters-sortbar',
  standalone: true,
  templateUrl: './filters-sortbar.component.html',
  styleUrl: './filters-sortbar.component.css',
})
export class MenFiltersSortbarComponent {
  @Input() shownProducts = 0;
  @Input() totalProducts = 0;
}
