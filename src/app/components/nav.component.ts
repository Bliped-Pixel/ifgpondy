import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <h2>🪨 Granite Business</h2>
        </div>
        <ul class="nav-links">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a></li>
          <li><a routerLink="/inventory" routerLinkActive="active">Inventory</a></li>
          <li><a routerLink="/billing" routerLinkActive="active">Billing</a></li>
          <li><a routerLink="/sales" routerLinkActive="active">Sales</a></li>
          <li><a routerLink="/purchase" routerLinkActive="active">Purchase</a></li>
          <li><a routerLink="/catalog" routerLinkActive="active">Catalog</a></li>
          <li><a routerLink="/legacy-rebuild" routerLinkActive="active">Access Rebuild</a></li>
        </ul>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .navbar-container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
    }

    .navbar-brand h2 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }

    .nav-links {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 30px;
    }

    .nav-links a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 0;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
    }

    .nav-links a:hover {
      border-bottom-color: white;
    }

    .nav-links a.active {
      border-bottom-color: #ffd700;
      color: #ffd700;
    }

    @media (max-width: 768px) {
      .navbar-container {
        flex-direction: column;
        gap: 15px;
      }

      .nav-links {
        gap: 15px;
        justify-content: center;
      }
    }
  `]
})
export class NavComponent {}
