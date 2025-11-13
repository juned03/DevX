import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { Policy } from '../../shared/models/policy';
import policiesSeed from '../../../assets/data/insurancePolicies.json';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgFor, FormsModule],
  template: `
    <div class="grid cols-2">
      <div style="grid-column:1/-1">
        <button class="btn" (click)="createDemo()" [disabled]="creating">{{ creating ? 'Creating...' : 'Create Demo Policy' }}</button>
      </div>
      <div class="card" *ngFor="let p of policies">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">{{p.policyNumber}}</div>
            <div style="color:#9aa3b2;font-size:12px">{{p.type}} • {{p.customerName}}</div>
          </div>
          <span class="tag" [ngClass]="statusClass(p.status)">{{p.status}}</span>
        </div>
        <div style="margin-top:12px;display:flex;gap:16px">
          <div>Premium: <b>{{p.premium | number:'1.2-2'}}</b></div>
          <div>Coverage: <b>{{p.coverage | number}}</b></div>
          <div>Start: <b>{{p.startDate}}</b></div>
          <div>End: <b>{{p.endDate}}</b></div>
        </div>
      </div>
    </div>
  `
})
export class PoliciesPageComponent implements OnInit {
  policies: Policy[] = (policiesSeed as unknown as Policy[]);
  creating = false;

  ngOnInit(): void {}

  statusClass(status: string) {
    return status === 'active' ? 'ok tag' : status === 'pending' ? 'warn tag' : 'bad tag';
  }

  createDemo() {
    this.creating = true;
    setTimeout(() => {
      this.policies = [
        {
          id: Date.now().toString(),
          policyNumber: 'POL-' + Math.floor(Math.random() * 100000),
          type: 'auto',
          customerName: 'New Customer',
          premium: 120.5,
          coverage: 15000,
          startDate: '2025-01-01',
          endDate: '2026-01-01',
          status: 'pending'
        },
        ...this.policies
      ];
      this.creating = false;
    }, 600);
  }
}


