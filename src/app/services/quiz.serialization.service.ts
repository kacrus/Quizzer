import { Injectable } from '@angular/core';
import { Quiz } from '../models/quiz';

@Injectable({
  providedIn: 'root'
})
export class QuizSerializationService {

  constructor() { }

  public serializeQuiz(quiz: Quiz): string {
    return JSON.stringify(quiz, null, 2);
  }

  public serializeQuizzes(quizzes: Quiz[]): string {
    return JSON.stringify(quizzes, null, 2);
  }

  public deserialize(str: string): Quiz[] {
    let item = JSON.parse(str);
    if (Array.isArray(item)) {
      return item as Quiz[];
    } else {
      return [item as Quiz];
    }
  }
}
