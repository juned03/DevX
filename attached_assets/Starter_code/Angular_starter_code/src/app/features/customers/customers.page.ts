import { Component } from '@angular/core';
import customersSeed from '../../../assets/data/customers.json';
import { NgFor } from '@angular/common';

@Component({
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="card">
      <div style="font-weight:700;margin-bottom:8px">Customers</div>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Policies</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of customers">
            <td>{{c.name}}</td>
            <td>{{c.email}}</td>
            <td>{{c.phone}}</td>
            <td>{{c.policies.join(', ')}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class CustomersPageComponent {
  customers = customersSeed as unknown as { id: string; name: string; email: string; phone: string; policies: string[] }[];
}


