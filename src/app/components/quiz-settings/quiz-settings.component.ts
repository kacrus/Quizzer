import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from 'src/app/services/quiz.service';

@Component({
  selector: 'app-quiz-settings',
  templateUrl: './quiz-settings.component.html',
  styleUrls: ['./quiz-settings.component.scss']
})
export class QuizSettingsComponent {
  protected quizName: string = "";

  constructor(
    private activatedRoute: ActivatedRoute,
    private quizService: QuizService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      let quizId = params["id"];
      this.quizService.getQuiz(quizId)
        .subscribe(quiz => {
          this.quizName = quiz?.name ?? "";
        });
    });
  }

  protected startQuiz(): void {
    let showAnswers = (document.getElementById("showAnswers") as any)?.checked == true;
    let shuffleQuestions = (document.getElementById("shuffleQuestions") as any)?.checked == true;

    this.router.navigate(["/quiz", this.activatedRoute.snapshot.params["id"]], {
      queryParams: {
        showAnswers: showAnswers,
        shuffleQuestions: shuffleQuestions
      }
    });
  }
}
