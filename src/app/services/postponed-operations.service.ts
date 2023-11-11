import { Injectable } from '@angular/core';
import { Quiz, QuizPassedReport } from '../models/quiz';
import { QuizzesService } from './quizzes.service';
import { ToastrService } from 'ngx-toastr';
import { Observable, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostponedOperationsService {

  constructor(
    private quizzesService: QuizzesService,
    private toastrService: ToastrService) { }

  public postponeCreateQuiz(quiz: Quiz) {
    localStorage.setItem("postponedCreateQuiz", JSON.stringify(quiz));
  }

  public postponeUpdateQuiz(quiz: Quiz) {
    localStorage.setItem("postponedEditQuiz", JSON.stringify(quiz));
  }

  public postponeDeleteQuiz(quizId: string) {
    localStorage.setItem("postponedDeleteQuiz", quizId);
  }

  public postponeSaveReport(report: QuizPassedReport) {
    localStorage.setItem("postponedSaveReport", JSON.stringify(report));
  }

  public executePostponed(): Observable<void> {
    return new Observable<void>(observer => {
      var observables = [];
      if (localStorage.getItem("postponedCreateQuiz") !== null) {
        let quiz = JSON.parse(localStorage.getItem("postponedCreateQuiz")!);

        let obs = this.quizzesService.createQuiz(quiz);
        observables.push(obs);
        obs.subscribe({
          next: () => {
            localStorage.removeItem("postponedCreateQuiz");
            this.toastrService.success("Postponed quiz created.");
            observer.next();
            observer.complete();
          },
          error: () => {
            this.toastrService.error("Failed to create postposed quiz.");
            observer.error();
            observer.complete();
          }
        });
        return;
      }

      if (localStorage.getItem("postponedEditQuiz") !== null) {
        let quiz = JSON.parse(localStorage.getItem("postponedEditQuiz")!);
        let obs = this.quizzesService.updateQuiz(quiz);
        observables.push(obs);
        obs.subscribe({
          next: () => {
            localStorage.removeItem("postponedEditQuiz");
            this.toastrService.success("Postponed quiz updated.");
            observer.next();
            observer.complete();
          },
          error: () => {
            this.toastrService.error("Failed to update postposed quiz.");
            observer.error();
            observer.complete();
          }
        });
        return;
      }

      if (localStorage.getItem("postponedDeleteQuiz") !== null) {
        let quizId = localStorage.getItem("postponedDeleteQuiz")!;
        let obs = this.quizzesService.deleteQuiz(quizId);
        observables.push(obs);
        obs.subscribe({
          next: () => {
            localStorage.removeItem("postponedDeleteQuiz");
            this.toastrService.success("Postponed quiz deleted.");
            observer.next();
            observer.complete();
          },
          error: () => {
            this.toastrService.error("Failed to delete postposed quiz.");
            observer.error();
            observer.complete();
          }
        });
        return;
      }

      if (localStorage.getItem("postponedSaveReport") !== null) {
        let report = JSON.parse(localStorage.getItem("postponedSaveReport")!);
        let obs = this.quizzesService.saveReport(report);
        observables.push(obs);

        obs.subscribe({
          next: () => {

            localStorage.removeItem("postponedSaveReport");
            this.toastrService.success("Postponed report saved.");
            observer.next();
            observer.complete();
          },
          error: () => {
            this.toastrService.error("Failed to save postposed report.");
            observer.error();
            observer.complete();
          }
        });
        return;
      }
    });
  }
}
