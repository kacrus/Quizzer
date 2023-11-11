import { Injectable } from '@angular/core';
import { DriveService, SpreadSheet, SpreadsheetData } from './drive.service';
import { Observable } from 'rxjs';
import { Folder, Quiz, QuizInfo, QuizPassedReport } from '../models/quiz';

@Injectable({
  providedIn: 'root'
})
export class QuizzesService {
  private readonly mainFile = 'QuizzerHierarchy';

  constructor(
    private driveService: DriveService
  ) { }

  public getQuiz(id: string): Observable<Quiz> {
    return new Observable<Quiz>(observer => {
      this.getQuizzesStructure()
        .subscribe({
          next: (rootFolder: Folder) => {
            let quizInfo = rootFolder.findQuiz(id);

            this.driveService.getSpreadsheetData(id).subscribe({
              next: (spreadsheetData: any) => {
                let quiz = new Quiz(id);
                quiz.name = quizInfo!.name;
                quiz.groups = quizInfo!.groups;

                let fieldIdsRow = spreadsheetData.sheets[0].data[0];
                let fieldNamesRow = spreadsheetData.sheets[0].data[1];
                let typesRow = spreadsheetData.sheets[0].data[2];

                for (let i = 1; i < fieldIdsRow.length; i++) {
                  let field = {
                    id: fieldIdsRow[i],
                    name: fieldNamesRow[i],
                    type: typesRow[i]
                  };

                  quiz.fields.push(field);
                }

                for (let i = 3; i < spreadsheetData.sheets[0].data.length; i++) {
                  let row = spreadsheetData.sheets[0].data[i];
                  let question: any = {};
                  for (let j = 1; j < row.length; j++) {
                    question[fieldIdsRow[j]] = row[j];
                  }

                  quiz.data.push(question);
                }

                observer.next(quiz);
                observer.complete();
              },
              error: (error: any) => {
                console.log(error);
              }
            });
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
    });
  }

  public getQuizzesStructure(): Observable<Folder> {
    let rootFolder: Folder = new Folder();
    rootFolder.name = 'Quizzer';

    return new Observable<Folder>(observer => {
      this.driveService.getSpreadsheetData(this.mainFile).subscribe({
        next: (spreadsheetData: any) => {
          for (let data of spreadsheetData.sheets[0].data) {
            if (data.length && data[0]) {
              this.appendToFolder(rootFolder, data);
            }
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

  public createMain(): Observable<void> {
    return new Observable<void>(observer => {
      this.driveService.createOrGetSpreadsheet(this.mainFile, ["Quizzes"]).subscribe({
        next: () => {
          observer.next();
          observer.complete();
        },
        error: (error: any) => {
          observer.error(error);
        }
      });
    });
  }

  public createQuiz(quiz: Quiz): Observable<Quiz> {
    return new Observable<Quiz>(observer => {
      this.driveService
        .createOrGetSpreadsheet(this.mainFile, ["Quizzes"])
        .subscribe({
          next: (mainSpreadSheet: SpreadSheet) => {
            this.driveService
              .createOrGetSpreadsheet(quiz.id, ["Questions", "AnswerStats"])
              .subscribe({
                next: (spreadSheet: SpreadSheet) => {
                  let quizDataToSave = this.getDataToSave(quiz);

                  this.driveService
                    .updateSpreadsheet(spreadSheet.fileId, "Questions", quizDataToSave)
                    .subscribe({
                      next: () => {
                        this.driveService
                          .appendValuesToSpreadsheet(mainSpreadSheet.fileId, "Quizzes", [[quiz.id, quiz.groups.join("/"), quiz.name, quiz.fields.length, quiz.data.length, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]])
                          .subscribe({
                            next: () => {
                              observer.next(quiz);
                              observer.complete();
                            },
                            error: (error: any) => {
                              observer.error(error);
                            }
                          });
                      },
                      error: (error: any) => {
                        observer.error(error);
                      }
                    });
                },
                error: (error: any) => {
                  observer.error(error);
                }
              })
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
    });
  }

  public deleteQuiz(quizId: string): Observable<void> {
    return new Observable<void>(observer => {
      this.driveService.getSpreadsheetData(this.mainFile)
        .subscribe({
          next: (spreadsheetData: SpreadsheetData) => {
            for (let row of spreadsheetData.sheets[0].data) {
              if (row[0] === quizId) {
                row[0] = '';
              }
            }

            this.driveService.updateSpreadsheetWithFileId(this.mainFile, "Quizzes", spreadsheetData.sheets[0].data)
              .subscribe({
                next: () => {
                  observer.next();
                  observer.complete();
                },
                error: (error: any) => {
                  observer.error(error);
                }
              });
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
    });
  }

  public saveReport(report: QuizPassedReport): Observable<void> {
    return new Observable<void>(observer => {
      let correct = report.questions.filter(q => q.answerFields.every(af => af.userAnswer === af.correctAnswer)).length / report.questions.length;
      this.driveService.appendValuesToSpreadsheetWithFileId(report.quizId, "AnswerStats", [[JSON.stringify(report)]])
        .subscribe({
          next: () => {
            this.driveService
              .getSpreadsheetData(this.mainFile)
              .subscribe({
                next: (spreadsheetData: SpreadsheetData) => {
                  for (let row of spreadsheetData.sheets[0].data) {
                    if (row[0] === report.quizId) {
                      ++row[5];
                      for (let i = 15; i > 6; i--) {
                        row[i] = row[i - 1];
                      }

                      row[6] = correct;
                      break;
                    }
                  }

                  this.driveService
                    .updateSpreadsheetWithFileId(this.mainFile, "Quizzes", spreadsheetData.sheets[0].data)
                    .subscribe({
                      next: () => {
                        observer.next();
                        observer.complete();
                      },
                      error: (error: any) => {
                        observer.error(error);
                      }
                    });
                },
                error: (error: any) => {
                  observer.error(error);
                }

              });
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
    });
  }

  public getReports(quizId: string): Observable<QuizPassedReport[]> {
    return new Observable<QuizPassedReport[]>(observer => {
      this.driveService.getSpreadsheetData(quizId).subscribe({
        next: (spreadsheetData: SpreadsheetData) => {

          var reports: QuizPassedReport[] = [];
          spreadsheetData.sheets[1].data.forEach((row: any) => {
            let report = JSON.parse(row[0]);
            report.date = new Date(report.date);
            reports.push(report);
          });

          observer.next(reports);
          observer.complete();
        },
        error: (error: any) => {
          console.log(error);
        }
      });
    });
  }

  public updateQuiz(quiz: Quiz): Observable<Quiz> {
    return new Observable<Quiz>(observer => {
      this.driveService
        .getSpreadsheetData(this.mainFile)
        .subscribe({
          next: (spreadsheetData: SpreadsheetData) => {
            for (let row of spreadsheetData.sheets[0].data) {
              if (row[0] === quiz.id) {
                row[2] = quiz.name;
                row[1] = quiz.groups.join("/");
                row[3] = quiz.fields.length;
                row[4] = quiz.data.length;
                break;
              }
            }

            this.driveService
              .updateSpreadsheetWithFileId(this.mainFile, "Quizzes", spreadsheetData.sheets[0].data)
              .subscribe({
                next: () => {
                  this.driveService
                    .updateSpreadsheetWithFileId(quiz.id, "Questions", this.getDataToSave(quiz))
                    .subscribe({
                      next: () => {
                        observer.next(quiz);
                        observer.complete();
                      },
                      error: (error: any) => {
                        observer.error(error);
                      }
                    });
                },
                error: (error: any) => {
                  observer.error(error);
                }
              });


          },
          error: (error: any) => {
            observer.error(error);
            console.log(error);
          }
        });
    });
  }

  private getDataToSave(quiz: Quiz): any[][] {
    let result: any[][] = [];

    var r1 = ["field_id"];
    var r2 = ["field_name"];
    var r3 = ["field_type"];

    r1.push(...quiz.fields.map(field => field.id));
    r2.push(...quiz.fields.map(field => field.name));
    r3.push(...quiz.fields.map(field => field.type));

    result.push(r1);
    result.push(r2);
    result.push(r3);

    for (let i = 0; i < quiz.data.length; i++) {
      let row: any[] = [];
      let data = quiz.data[i];

      row.push(`question-${i + 1}`);
      row.push(...quiz.fields.map(field => data[field.id]));

      result.push(row);
    }

    return result;
  }


  private appendToFolder(folder: Folder, data: any[]): void {
    let currentFolder = folder;
    let groups = data[1].split("/");
    for (let i = 0; i < groups.length; i++) {
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
    info.id = data[0];
    info.groups = data[1].split("/");
    info.name = data[2];
    info.fields = data[3];
    info.data = data[4];
    info.passedCount = data[5];

    let values = [];
    for (let i = 6; i < 16; i++) {
      if (data[i] >= 0) {
        values.push(Number(data[i]));
      }
    }

    if (values.length > 0) {
      info.last10AnswerSuccessRate = values.reduce((acc, cur) => acc + cur, 0) / values.length;
      let fiveElements = values.slice(0, 5);
      info.last5AnswerSuccessRate = fiveElements.reduce((acc, cur) => acc + cur, 0) / fiveElements.length;
    }

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
