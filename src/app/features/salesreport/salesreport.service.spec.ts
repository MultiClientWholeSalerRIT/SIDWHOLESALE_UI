import { TestBed } from '@angular/core/testing';

import { SalesreportService } from './salesreport.service';

describe('SalesreportService', () => {
  let service: SalesreportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalesreportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
