import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Quiz } from 'src/app/models/quiz';
import { QuizService } from 'src/app/services/quiz.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  protected quizzes: Quiz[] = [];

  constructor(
    private quizService: QuizService,
    private router: Router) { }

  ngOnInit(): void {
    this.quizService.getQuizzes()
      .subscribe(quizzes => {
        this.quizzes = quizzes;
      });
  }

  protected createNewQuizClick(): void {
    this.router.navigate(["/quiz/create"]);
  }

  protected editQuizClick(quiz: Quiz): void {
    this.router.navigate(["/quiz/edit", quiz.id]);
  }

  protected deleteQuizClick(quiz: Quiz): void {
    if(!confirm(`Are you sure you want to delete the quiz "${quiz.name}"?`)){
      return;
    }

    this.quizService.deleteQuiz(quiz.id)
    .subscribe({
      next: () => {
        let index = this.quizzes.indexOf(quiz);
        if(index > -1){
          this.quizzes.splice(index, 1);
        }
      },
      error: (err) => {
        // todo: replace with a toast
        console.error(err);
      }
    });
  }
}
