import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz } from 'src/app/models/quiz';
import { QuizService } from 'src/app/services/quiz.service';

@Component({
  selector: 'app-quiz-edit',
  templateUrl: './quiz-edit.component.html',
  styleUrls: ['./quiz-edit.component.scss']
})
export class QuizEditComponent {
  protected notFound: boolean = false;
  protected quiz: Quiz | null = null;

  constructor(
    route: ActivatedRoute,
    quizService: QuizService,
    private router: Router,
  ) {
    route.params.subscribe(params => {
      let id = params["id"];
      if(id) {
        quizService.getQuiz(id)
        .subscribe({
          next: (quiz) => {
            if(quiz){
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

  public onQuizSaved(): void {
    this.router.navigate(["/"], { queryParams: { path: this.quiz?.groups.join("/") }});
  }
}
