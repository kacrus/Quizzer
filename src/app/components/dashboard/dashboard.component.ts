import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Quiz } from 'src/app/models/quiz';
import { QuizSerializationService } from 'src/app/services/quiz.serialization.service';
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
    private quizSerializationService: QuizSerializationService,
    private router: Router) { }

  ngOnInit(): void {
    this.quizService.getQuizzes()
      .subscribe(quizzes => {
        quizzes.sort((a, b) => a.name.localeCompare(b.name));
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

  protected downloadQuizes(): void {
    let data: string = this.quizSerializationService.serializeQuizzes(this.quizzes);
    this.downloadData(data, `quizzes`);
  }

  protected downloadQuiz(quiz: Quiz): void {
    let data: string = this.quizSerializationService.serializeQuiz(quiz);
    this.downloadData(data, `${quiz.name} (${quiz.id})`);
  }

  protected runQuiz(quiz: Quiz): void {
    this.router.navigate(["/quiz", quiz.id]);
  }

  protected uploadQuizzes(event: any): void {
    let file = event.target.files[0];
    if (!file) {
      return;
    }

    console.log(file);

    let reader = new FileReader();
    reader.onloadend = (e) => {
      let data = reader.result as string;
      let quizzes = this.quizSerializationService.deserialize(data);

      this.quizService.hasDublicateQuizzes(quizzes).subscribe({
        next: hasDuplicateQuizzes => {
          if(hasDuplicateQuizzes) {
            if(!confirm(`Some of the quizzes you are trying to upload already exist. Do you want to overwrite them?`)){
              return;
            }
          }
  
            for(let i = 0; i < quizzes.length; i++){
              this.quizService.save(quizzes).subscribe({
                next: () => {
                  let index = this.quizzes.findIndex(q => q.id === quizzes[i].id);
                  if(index > -1){
                    this.quizzes.splice(index, 1);
                  }
                  this.quizzes.push(quizzes[i]);
                },
                error: (err) => {
                  console.error(err);
                }
              });
            }
        },
        error: (err) => {
          console.error(err);
        }
      });
      }

    reader.readAsText(file);
  }

  private downloadData(data: string, filename: string): void {
    let blob = new Blob([data], { type: 'application/json' });
    let url = window.URL.createObjectURL(blob);
    let anchor = document.createElement("a");
    anchor.download = `${filename}.json`;
    anchor.href = url;
    anchor.click();
  }
}
