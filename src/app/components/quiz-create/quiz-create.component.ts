import { Component } from '@angular/core';
import { FieldType, Quiz } from 'src/app/models/quiz';

@Component({
  selector: 'app-quiz-create',
  templateUrl: './quiz-create.component.html',
  styleUrls: ['./quiz-create.component.scss']
})
export class QuizCreateComponent {
  protected quiz: Quiz;

  constructor() {
    this.quiz = new Quiz();

    this.quiz.name = "New Quiz";

    this.quiz.fields.push({ name: "Field #1", type: FieldType.Text });
    this.quiz.fields.push({ name: "Field #2", type: FieldType.Text });

    this.quiz.data.push({ "Field #1": "value 1", "Field #2": "value 2" });
  }
}
