import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsreportComponent } from './smsreport.component';

describe('SmsreportComponent', () => {
  let component: SmsreportComponent;
  let fixture: ComponentFixture<SmsreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SmsreportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmsreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
