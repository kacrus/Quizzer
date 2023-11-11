import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz } from 'src/app/models/quiz';
import { QuizService } from 'src/app/services/quiz.service';
import { QuizzesService } from 'src/app/services/quizzes.service';

@Component({
  selector: 'app-quiz-edit',
  templateUrl: './quiz-edit.component.html',
  styleUrls: ['./quiz-edit.component.scss']
})
export class QuizEditComponent {
  protected notFound: boolean = false;
  protected quiz: Quiz | null = null;
  protected isSaving: boolean = false;

  constructor(
    route: ActivatedRoute,
    private quizzesService: QuizzesService,
    private router: Router,
  ) {
    route.params.subscribe(params => {
      let id = params["id"];
      if (id) {
        quizzesService
          .getQuiz(id)
          .subscribe({
            next: (quiz) => {
              if (quiz) {
                this.quiz = quiz;
              } else {
                this.notFound = true;
              }
            },
            error: (err) => {
              // todo: replace with a toast
              console.log("Error", err);
            }
          });
      } else {
        this.notFound = true;
      }
    });
  }

  public onQuizSaved(quiz: Quiz): void {
    this.isSaving = true;
    this.quizzesService
    .updateQuiz(quiz)
    .subscribe({
      next: () => {
        this.router.navigate(["/"], { queryParams: { path: quiz.groups.join("/") } });
      },
      error: (err) => {
        this.isSaving = false;
        console.log("Error", err);
      }
    });
  }
}
