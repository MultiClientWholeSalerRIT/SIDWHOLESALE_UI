import { Component, TemplateRef } from '@angular/core';
import { ToastService } from './toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-toasts',
    template: `
    <ngb-toast
      *ngFor="let toast of toastService.toasts"
      [class]="toast.classname"
      [autohide]="true"
      [delay]="toast.delay || 5000"
      (hidden)="toastService.remove(toast)"
      [@toastAnimation]
    >
      <ng-template [ngIf]="isTemplate(toast)" [ngIfElse]="text">
        <ng-template [ngTemplateOutlet]="toast.textOrTpl"></ng-template>
      </ng-template>

      <ng-template #text>{{ toast.textOrTpl }}</ng-template>
    </ngb-toast>
  `,
    host: { '[class.ngb-toasts]': 'true' },
    standalone: false,
    animations: [
        trigger('toastAnimation', [
            transition(':enter', [
                style({ transform: 'translateY(100%)', opacity: 0 }),
                animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('300ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class ToastsContainer {
    constructor(public toastService: ToastService) {}

    isTemplate(toast:any) { 
        return toast.textOrTpl instanceof TemplateRef; 
    }
}
