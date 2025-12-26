import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginusermgmtComponent } from './loginusermgmt.component';

describe('LoginusermgmtComponent', () => {
  let component: LoginusermgmtComponent;
  let fixture: ComponentFixture<LoginusermgmtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginusermgmtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginusermgmtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
