import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesapprovalComponent } from './salesapproval.component';

describe('SalesapprovalComponent', () => {
  let component: SalesapprovalComponent;
  let fixture: ComponentFixture<SalesapprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesapprovalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesapprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
