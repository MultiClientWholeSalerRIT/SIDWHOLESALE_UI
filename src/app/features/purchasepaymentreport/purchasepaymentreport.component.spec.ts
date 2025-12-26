import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchasepaymentreportComponent } from './purchasepaymentreport.component';

describe('PurchasepaymentreportComponent', () => {
  let component: PurchasepaymentreportComponent;
  let fixture: ComponentFixture<PurchasepaymentreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchasepaymentreportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchasepaymentreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
