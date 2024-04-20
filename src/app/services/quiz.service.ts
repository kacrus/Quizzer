import { Injectable } from '@angular/core';
import { Field, Folder, Quiz, QuizInfo, QuizPassedReport, QuizPassedReportAnswerField, QuizPassedReportQuestion } from '../models/quiz';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  private shortPrefix: string = "short/";
  private dataPrefix: string = "data/";

  constructor(
    private apiService: ApiService
  ) { }

  public hasDublicateQuizzes(quizzes: Quiz[]): Observable<boolean> {
    return new Observable<boolean>(observer => {
      var ids = quizzes.map(q => q.id);

      this.apiService.post("/action/findOne", {
        "collection": "quizzes",
        "filter": {
          "_id": { "$in": ids }
        }
      }).subscribe({
        next: (response: any) => {
          observer.next(response.document != null);
        },
        error: (err: any) => {
          observer.error(err)
        },
        complete: () => {
          observer.complete();
        }
      })

    });
  }

  public getQuizzes(group: string[]): Observable<Quiz[]> {
    for (let i = 0; i < group.length; i++) {
      if (group[i] === "") {
        group.splice(i, 1);
        i--;
      }
    }

    let filter:any = {};
    for(let i = 0; i < group.length; i++) {
      filter["groups."+i] = group[i];
    }

    console.log("downloading quzzes for group:", filter);

    return new Observable<Quiz[]>(observer => {
      this.apiService.post("/action/find", {
        "collection": "quizzes",
        "filter": filter
      })
        .subscribe({
          next: (response: any) => {
            var quizzes = response.documents.map((d: any) => {return {
              id: d._id,
              name: d.name,
              groups: d.groups,
              fields: d.fields,
              data: d.data,
              specialCharacters: d.specialCharacters
            }})


            observer.next(quizzes);
          },
          error: (err: any) => {
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          }
        })
    });
  }

  public getQuiz(id: string): Observable<Quiz | null> {
    return new Observable<Quiz>(observer => {
      this.apiService.post("/action/findOne", {
        "collection": "quizzes",
        "filter": {
          _id: id
        }
      })
        .subscribe({
          next: (response: any) => {
            observer.next({
              id: response.document._id,
              name: response.document.name,
              groups: response.document.groups,
              fields: response.document.fields,
              data: response.document.data,
              specialCharacters: response.document.specialCharacters
            });
          },
          error: (err: any) => {
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          }
        })
    });
  }

  private buildShortId(id: string): string {
    return this.shortPrefix + id;
  }

  private buildDataId(id: string): string {
    return this.dataPrefix + id;
  }

  private isSubGroup(groups: string[], group: string[]): boolean {
    if (groups.length < group.length) {
      return false;
    }

    for (let i = 0; i < group.length; i++) {
      if (groups[i] !== group[i]) {
        return false;
      }
    }

    return true;
  }


}

class AllQuizzes {
  public quizzes: QuizShort[] = [];
  public spreadsheetId: string = "";
}

class QuizzerData {
  public folderId: string = "";
  public spreadsheetId: string = "";
}

class QuizShort {
  public id: string = "";
  public name: string = "";
  public groups: string[] = [];
  public fields: number = 0;
  public data: number = 0;

  public passedCount: number = 0;

  public last5AnswerSuccessRate: number | undefined;
  public last10AnswerSuccessRate: number | undefined;
}

class QuizData {
  public fields: Field[] = [];
  public data: any[] = [];
}
