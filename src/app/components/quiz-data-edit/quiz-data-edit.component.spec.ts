import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizDataEditComponent } from './quiz-data-edit.component';

describe('QuizDataEditComponent', () => {
  let component: QuizDataEditComponent;
  let fixture: ComponentFixture<QuizDataEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuizDataEditComponent]
    });
    fixture = TestBed.createComponent(QuizDataEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
