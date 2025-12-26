import { TestBed } from '@angular/core/testing';

import { PurchasereportService } from './purchasereport.service';

describe('PurchasereportService', () => {
  let service: PurchasereportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PurchasereportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
