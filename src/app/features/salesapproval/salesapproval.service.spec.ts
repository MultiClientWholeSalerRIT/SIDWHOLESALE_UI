import { TestBed } from '@angular/core/testing';

import { SalesapprovalService } from './salesapproval.service';

describe('SalesapprovalService', () => {
  let service: SalesapprovalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalesapprovalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
