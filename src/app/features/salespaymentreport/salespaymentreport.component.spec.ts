import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalespaymentreportComponent } from './salespaymentreport.component';

describe('SalespaymentreportComponent', () => {
  let component: SalespaymentreportComponent;
  let fixture: ComponentFixture<SalespaymentreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SalespaymentreportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalespaymentreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
