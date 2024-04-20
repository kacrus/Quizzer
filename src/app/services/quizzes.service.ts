import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Folder, Quiz, QuizInfo, QuizPassedReport } from '../models/quiz';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class QuizzesService {
  constructor(
    private apiService: ApiService,
  ) { }

  public getQuiz(id: string): Observable<Quiz> {
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

  public getQuizzesStructure(): Observable<Folder> {
    let rootFolder: Folder = new Folder();
    rootFolder.name = 'Quizzer';

    return new Observable<Folder>(observer => {
      this.apiService.post("/action/find", {
        "collection": "quizzes",
        "filter": {
        },
        "projection": {
          id: "$_id",
          groups: 1,
          name: 1,
          type: 1,
          passed: 1,
          last5: { $avg: "$last5"},
          last10: { $avg: "$last10"},
          fields: {
            "$size": "$fields"
          },
          data: {
            "$size": "$data"
          }
        }
      }).subscribe({
        next: (response: any) => {
          console.log(response);
          for (let item of response.documents) {
            this.appendToFolder(rootFolder, item);
          }

          observer.next(rootFolder);
          observer.complete();
        },
        error: (error: any) => {
          console.log(error);
        }

      });
    });
  }

  public createQuiz(quiz: Quiz): Observable<Quiz> {
    return new Observable<Quiz>(observer => {
      this.apiService.post("/action/updateOne", {
        "collection": "quizzes",
        "upsert": true,
        "filter": {
          "_id": quiz.id
        },
        "update": {
          "$set": {
            "groups": quiz.groups,
            "name": quiz.name,
            "fields": quiz.fields,
            "data": quiz.data,
            "specialCharacters": quiz.specialCharacters
          }
        }
      }).subscribe({
        next: () => {
          observer.next(quiz);
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

  public deleteQuiz(quizId: string): Observable<void> {
    return new Observable<void>(observer => {
      this.apiService.post("/action/deleteOne", {
        "collection": "quizzes",
        "filter": {
          _id: quizId
        }
      }).subscribe({
        next: () => {
          observer.next();
        },
        error: (err: any) => {
          observer.error(err);
        },
        complete: () => {
          observer.complete();
        }
      });
    });
  }

  public saveReport(report: QuizPassedReport): Observable<void> {
    return new Observable<void>(observer => {
      let correct = report.questions.filter(q => q.answerFields.every(af => af.userAnswer === af.correctAnswer)).length / report.questions.length;
      this.apiService.post("/action/updateOne", {
        "collection": "quizzes",
        "filter": {
          "_id": report.quizId
        },
        "update": {
          "$inc": {
            "passed": 1
          },
          "$push": {
            last5: {
              "$each": [ correct ],
              "$slice": -5
            },
            last10: {
              "$each": [ correct ],
              "$slice": -10
            }
          }
        }
      }).subscribe({
        next:() =>{
          console.log("success");
        },
        error: (err: any) => {
          console.log("error", err);
        }
      })


      this.apiService.post("/action/insertOne", {
        "collection": "reports",
        "document": {
          _id: report.id,
          date: {
            "$date" : {"$numberLong": report.date.getTime().toString()}
          },
          quizId: report.quizId,
          fields: report.fields,
          questions: report.questions
        }
      }).subscribe({
        next: () => {
          observer.next();
        },
        error: (err: any) => {
          observer.next(err);
        },
        complete: () => {
          observer.complete();
        }
      })
    });
  }

  public getReports(quizId: string): Observable<QuizPassedReport[]> {
    return new Observable<QuizPassedReport[]>(observer => {
      this.apiService.post("/action/find", {
        "collection": "reports",
        "filter": {
          "quizId": quizId
        },
        "sort": {
          "date": 1
        }
      }).subscribe({
        next:(response:any) => {
          
      observer.next(response.documents);
      observer.complete();
        },
        error: (err: any) => {
          observer.next(err);
        },
        complete: () => {
          observer.complete();
        }
      })
    });
  }

  public updateQuiz(quiz: Quiz): Observable<Quiz> {
    return this.createQuiz(quiz);
  }

  private appendToFolder(folder: Folder, data: any): void {
    let currentFolder = folder;
    let groups = data.groups;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i] == "") {
        continue;
      }

      let subFolder = currentFolder.subFolders.find(f => f.name === groups[i]);
      if (!subFolder) {
        subFolder = new Folder();
        subFolder.name = groups[i];
        currentFolder.subFolders.push(subFolder);

        currentFolder.subFolders.sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          } else if (a.name > b.name) {
            return 1;
          } else {
            return 0;
          }
        });
      }

      currentFolder = subFolder;
    }

    let info = new QuizInfo();
    info.id = data.id;
    info.groups = data.groups;
    info.name = data.name;
    info.fields = data.fields;
    info.data = data.data;
    info.passedCount = data.passed;
    info.last10AnswerSuccessRate = data.last10;
    info.last5AnswerSuccessRate = data.last5;

    currentFolder.quizzes.push(info);

    currentFolder.quizzes.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    });
  }

}
