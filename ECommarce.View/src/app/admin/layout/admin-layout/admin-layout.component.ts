import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, AdminHeaderComponent, AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {}
