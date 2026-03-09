import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <div class="hero">
        <h1>Welcome to Granite Business Management</h1>
        <p>Manage your granite business with ease</p>
      </div>

      <div class="features">
        <div class="feature-card">
          <h3>📦 Inventory Management</h3>
          <p>Manage stone types, quantities, and sizes. Track stock levels and get low-stock alerts.</p>
          <a href="/inventory" class="btn btn-primary">Go to Inventory</a>
        </div>

        <div class="feature-card">
          <h3>💰 Billing System</h3>
          <p>Create professional invoices with GST integration. Track payments and generate reports.</p>
          <a href="/billing" class="btn btn-primary">Go to Billing</a>
        </div>

        <div class="feature-card">
          <h3>🧾 Sales Entry</h3>
          <p>Create sales entries with size-based pricing, GST and automatic stock deduction with cutting support.</p>
          <a href="/sales" class="btn btn-primary">Go to Sales</a>
        </div>

        <div class="feature-card">
          <h3>🛒 Purchase Entry</h3>
          <p>Record purchase entries and update size-wise inventory quantities in one step.</p>
          <a href="/purchase" class="btn btn-primary">Go to Purchase</a>
        </div>

        <div class="feature-card">
          <h3>🛍️ Online Catalog</h3>
          <p>Preview all available stones. Filter by type, color, and price. Share with customers.</p>
          <a href="/catalog" class="btn btn-primary">View Catalog</a>
        </div>

        <div class="feature-card">
          <h3>🧩 Access Rebuild</h3>
          <p>Track and migrate your Microsoft Access forms, reports, and workflows into this Angular app.</p>
          <a href="/legacy-rebuild" class="btn btn-primary">Open Rebuild Dashboard</a>
        </div>
      </div>

      <div class="info-section">
        <h2>Key Features</h2>
        <ul>
          <li>✓ Easy stone inventory tracking with preset sizes</li>
          <li>✓ Professional invoicing with GST calculations</li>
          <li>✓ Real-time stock management</li>
          <li>✓ Customer information management</li>
          <li>✓ Payment status tracking</li>
          <li>✓ Searchable online catalog</li>
          <li>✓ Multiple filtering options (type, color, price)</li>
          <li>✓ Low stock alerts</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .hero {
      text-align: center;
      margin-bottom: 60px;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
    }

    .hero h1 {
      margin: 0 0 15px 0;
      font-size: 42px;
    }

    .hero p {
      margin: 0;
      font-size: 18px;
      opacity: 0.9;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      margin-bottom: 60px;
    }

    .feature-card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .feature-card h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 20px;
    }

    .feature-card p {
      margin: 0 0 20px 0;
      color: #666;
      line-height: 1.6;
    }

    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.3s;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .info-section {
      background: #f9f9f9;
      padding: 40px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .info-section h2 {
      margin: 0 0 25px 0;
      color: #333;
    }

    .info-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .info-section li {
      padding: 10px 0;
      color: #555;
      font-size: 16px;
      border-bottom: 1px solid #eee;
    }

    .info-section li:last-child {
      border-bottom: none;
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 28px;
      }

      .features {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent {}
