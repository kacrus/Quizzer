import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldType, Quiz } from 'src/app/models/quiz';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-quiz-create',
  templateUrl: './quiz-create.component.html',
  styleUrls: ['./quiz-create.component.scss']
})
export class QuizCreateComponent {
  protected quiz: Quiz;
  protected group: string = "";

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.group = params.get("group") ?? "";
    });


    let id: string = uuid();
    this.quiz = new Quiz(id);

    this.quiz.name = "New Quiz";
    this.quiz.groups = this.group.split("/").filter(g => g.length > 0);

    this.quiz.fields.push({ id: uuid(), name: "Field #1", type: FieldType.Text });
    this.quiz.fields.push({ id:uuid(), name: "Field #2", type: FieldType.Text });

    this.quiz.data.push({ "Field #1": "value 1", "Field #2": "value 2" });
  }

  public onQuizSaved(): void {
    this.router.navigate(["/"], { queryParams: { path: this.group }});
  }
}
