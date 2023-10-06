import { Injectable } from '@angular/core';
import { Field, Quiz } from '../models/quiz';
import { v4 as uuid } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class QuizSerializationService {

  constructor() { }

  public serializeQuiz(quiz: Quiz): string {
    let item: SerializeClass =  {
      id: quiz.id,
      name: quiz.name,
      groups: quiz.groups,
      fields: quiz.fields,
      data: quiz.data
    }

    return JSON.stringify(item, null, 2);
  }

  public serializeQuizzes(quizzes: Quiz[]): string {
    let item: SerializeClass[] = quizzes.map(quiz => {
      return {
        id: quiz.id,
        name: quiz.name,
        groups: quiz.groups,
        fields: quiz.fields,
        data: quiz.data
      }
    });

    return JSON.stringify(item, null, 2);
  }

  public deserialize(str: string): Quiz[] {
    let item = JSON.parse(str);
    if (Array.isArray(item)) {
      let items = item as SerializeClass[];
      return items.map(item => {
        return {
          id: item.id ?? uuid(),
          name: item.name,
          groups: item.groups ?? [],
          fields: item.fields,
          data: item.data
        } as Quiz
      });
    } else {
      let serItem = item as SerializeClass;
      return [{
        id: item.id ?? uuid(),
        name: serItem.name,
        groups: serItem.groups ?? [],
        fields: serItem.fields,
        data: serItem.data
      } as Quiz];
    }
  }
}

class SerializeClass {
  public id: string = "";
  public name: string = "";
  public groups: string[] = [];
  public fields: Field[] = [];
  public data: any[] = [];
}
