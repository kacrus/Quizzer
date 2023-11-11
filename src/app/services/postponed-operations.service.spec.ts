import { TestBed } from '@angular/core/testing';

import { PostponedOperationsService } from './postponed-operations.service';

describe('PostponedOperationsService', () => {
  let service: PostponedOperationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostponedOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
