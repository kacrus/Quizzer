import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FieldType, Quiz } from 'src/app/models/quiz';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-quiz-create',
  templateUrl: './quiz-create.component.html',
  styleUrls: ['./quiz-create.component.scss']
})
export class QuizCreateComponent {
  protected quiz: Quiz;

  constructor(
    private router: Router,
  ) {
    let id: string = uuid();
    this.quiz = new Quiz(id);

    this.quiz.name = "New Quiz";

    this.quiz.fields.push({ name: "Field #1", type: FieldType.Text });
    this.quiz.fields.push({ name: "Field #2", type: FieldType.Text });

    this.quiz.data.push({ "Field #1": "value 1", "Field #2": "value 2" });
  }

  public onQuizSaved(): void {
    this.router.navigate(["/"]);
  }
}
