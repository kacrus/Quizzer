import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldType, Quiz } from 'src/app/models/quiz';
import { PostponedOperationsService } from 'src/app/services/postponed-operations.service';
import { QuizzesService } from 'src/app/services/quizzes.service';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-quiz-create',
  templateUrl: './quiz-create.component.html',
  styleUrls: ['./quiz-create.component.scss']
})
export class QuizCreateComponent {
  protected quiz: Quiz;
  protected group: string = "";
  protected isSaving: boolean = false;

  constructor(
    private quizzesService: QuizzesService,
    private postponedOperationsService: PostponedOperationsService,
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
    this.quiz.fields.push({ id: uuid(), name: "Field #2", type: FieldType.Text });

    this.quiz.data.push({ "Field #1": "value 1", "Field #2": "value 2" });
  }

  public onQuizSaved(quiz: Quiz): void {
    this.isSaving = true;
    this.quizzesService.createQuiz(quiz)
      .subscribe({
        next: (quiz: Quiz) => {
          this.router.navigate(["/"], { queryParams: { path: this.group } });
        },
        error: (error: any) => {
          if ([401, 403].indexOf(error.status) !== -1) {
            this.postponedOperationsService.postponeCreateQuiz(quiz);
          }
          
          this.isSaving = false;
          console.error(error);
        }
      });

  }
}
