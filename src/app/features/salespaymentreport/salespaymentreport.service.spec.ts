import { TestBed } from '@angular/core/testing';

import { SalespaymentreportService } from './salespaymentreport.service';

describe('SalespaymentreportService', () => {
  let service: SalespaymentreportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalespaymentreportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
