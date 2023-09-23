import { TestBed } from '@angular/core/testing';

import { QuizSerializationService } from './quiz.serialization.service';

describe('QuizSerializationService', () => {
  let service: QuizSerializationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizSerializationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
