import { TestBed } from '@angular/core/testing';

import { PurchasepaymentreportService } from './purchasepaymentreport.service';

describe('PurchasepaymentreportService', () => {
  let service: PurchasepaymentreportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PurchasepaymentreportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
