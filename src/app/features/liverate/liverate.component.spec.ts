import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiverateComponent } from './liverate.component';

describe('LiverateComponent', () => {
  let component: LiverateComponent;
  let fixture: ComponentFixture<LiverateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiverateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiverateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
