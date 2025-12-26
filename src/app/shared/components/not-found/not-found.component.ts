import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100">
        <div class="col-md-6 text-center">
          <img src="assets/img/not-found.svg" alt="404" class="img-fluid mb-4" style="max-width: 300px;">
          <h2 class="mb-4">Page Not Found</h2>
          <p class="mb-4">The page you're looking for doesn't exist or has been moved.</p>
          <button class="btn btn-primary" (click)="goToDashboard()">Go to Dashboard</button>
        </div>
      </div>
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [CommonModule]
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}