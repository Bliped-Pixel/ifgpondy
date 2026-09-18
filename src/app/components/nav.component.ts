import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" aria-label="Primary navigation">
      <div class="navbar-container">
        <a class="navbar-brand" routerLink="/" aria-label="Indo French Granites home">
          <span class="brand-mark"><img src="brand/ifg-monogram-v2.png" alt="" /></span>
          <span class="brand-copy">
            <strong>Indo French</strong>
            <small>Granites · Since 1990</small>
          </span>
        </a>

        <div class="nav-scroll">
          <ul class="nav-links">
            <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a></li>
            <li><a routerLink="/inventory" routerLinkActive="active">Inventory</a></li>
            <li><a routerLink="/billing" routerLinkActive="active">Billing</a></li>
            <li><a routerLink="/sales" routerLinkActive="active">Sales</a></li>
            <li><a routerLink="/purchase" routerLinkActive="active">Purchase</a></li>
            <li><a routerLink="/accounts" routerLinkActive="active">Accounts</a></li>
            <li><a routerLink="/accounts-reports" routerLinkActive="active">Reports</a></li>
            <li><a routerLink="/catalog" routerLinkActive="active">Catalog</a></li>
            <li><a routerLink="/legacy-rebuild" routerLinkActive="active">Access Rebuild</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; }

    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid rgba(255, 255, 255, .09);
      color: #fff;
      background: rgba(29, 35, 31, .97);
      box-shadow: 0 8px 30px rgba(22, 27, 24, .14);
      backdrop-filter: blur(16px);
    }

    .navbar-container {
      width: min(1720px, calc(100% - 32px));
      min-height: 68px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 30px;
    }

    .navbar-brand {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 11px;
      color: inherit;
      text-decoration: none;
    }

    .brand-mark {
      width: 43px;
      height: 43px;
      display: grid;
      place-items: center;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 12px 6px 12px 6px;
      background: #f2ede4;
      box-shadow: inset 0 1px rgba(255, 255, 255, .2), 0 5px 16px rgba(0, 0, 0, .18);
    }

    .brand-mark img { width: 93%; height: 93%; object-fit: contain; }

    .brand-copy { display: flex; flex-direction: column; line-height: 1.05; }
    .brand-copy strong { font-size: 14px; letter-spacing: .02em; }
    .brand-copy small { margin-top: 5px; color: #aeb7b0; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }

    .nav-scroll {
      min-width: 0;
      flex: 1;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .nav-scroll::-webkit-scrollbar { display: none; }

    .nav-links {
      min-width: max-content;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 4px;
      list-style: none;
    }

    .nav-links a {
      position: relative;
      display: block;
      border-radius: 9px;
      padding: 10px;
      color: #bbc2bd;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
      transition: color 150ms ease, background 150ms ease;
    }

    .nav-links a:hover { color: #fff; background: rgba(255, 255, 255, .06); }
    .nav-links a.active { color: #fff7f1; background: rgba(166, 83, 49, .28); }

    .nav-links a.active::after {
      content: '';
      position: absolute;
      right: 10px;
      bottom: 5px;
      left: 10px;
      height: 2px;
      border-radius: 2px;
      background: #c97951;
    }

    .navbar-brand:focus-visible,
    .nav-links a:focus-visible {
      outline: 2px solid #d68a63;
      outline-offset: 2px;
    }

    @media (max-width: 900px) {
      .navbar-container { width: calc(100% - 20px); gap: 16px; }
      .brand-copy { display: none; }
      .nav-links { justify-content: flex-start; }
    }

    @media (max-width: 560px) {
      .navbar-container { width: 100%; min-height: 60px; padding: 0 10px; gap: 9px; }
      .brand-mark { width: 38px; height: 38px; }
      .nav-links a { padding: 9px 8px; font-size: 10px; }
    }
  `]
})
export class NavComponent {}
