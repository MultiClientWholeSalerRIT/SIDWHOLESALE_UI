import { TestBed } from '@angular/core/testing';

import { LoginusermgmtService } from './loginusermgmt.service';

describe('LoginusermgmtService', () => {
  let service: LoginusermgmtService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoginusermgmtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
