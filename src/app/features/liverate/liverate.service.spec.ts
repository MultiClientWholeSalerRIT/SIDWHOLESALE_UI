import { TestBed } from '@angular/core/testing';

import { LiverateService } from './liverate.service';

describe('LiverateService', () => {
  let service: LiverateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiverateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
