import { TestBed } from '@angular/core/testing';

import { SmsreportService } from './smsreport.service';

describe('SmsreportService', () => {
  let service: SmsreportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmsreportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
