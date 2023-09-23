import { Injectable } from '@angular/core';
import { Quiz } from '../models/quiz';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  constructor() { }

  public hasDublicateQuizzes(quizzes: Quiz[]) : Observable<boolean> {
    return new Observable<boolean>(observer => {
      for(let i = 0; i < quizzes.length; i++){
        if(localStorage.getItem(quizzes[i].id)) {
          observer.next(true);
          observer.complete();
          return;
        }
      }

      observer.next(false);
      observer.complete();
    });
  }

  public save(quizzes: Quiz[]): Observable<Quiz[]> {
    return new Observable<Quiz[]>(observer => {
      for(let i = 0; i < quizzes.length; i++){
        localStorage.setItem(quizzes[i].id, JSON.stringify(quizzes[i]));
      }
      observer.next(quizzes);
      observer.complete();
    });
  }

  public getQuiz(id: string): Observable<Quiz | null> {
    return new Observable<Quiz | null>(observer => {
      let quiz = localStorage.getItem(id);
      if(quiz){
        observer.next(JSON.parse(quiz));
      } else {
        observer.next(null);
      }
      
      observer.complete();
    });
  }

  public getQuizzes(): Observable<Quiz[]> {
    return new Observable<Quiz[]>(observer => {
      let quizzes: Quiz[] = [];
      for(let i = 0; i < localStorage.length; i++){
        let key = localStorage.key(i);
        if(key){
          let quiz = localStorage.getItem(key);
          if(quiz){
            quizzes.push(JSON.parse(quiz));
          }
        }
      }

      observer.next(quizzes);
      observer.complete();
    });
  }

  public deleteQuiz(id: string): Observable<void> {
    return new Observable<void>(observer => {
      localStorage.removeItem(id);
      observer.next();
      observer.complete();
    });
  }
}
