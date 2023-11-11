import { Injectable } from '@angular/core';
import { Field, Folder, Quiz, QuizInfo, QuizPassedReport, QuizPassedReportAnswerField, QuizPassedReportQuestion } from '../models/quiz';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  private shortPrefix: string = "short/";
  private dataPrefix: string = "data/";
  private reportPrefix: string = "report/";

  constructor(
    private httpClient: HttpClient
  ) { }

  public hasDublicateQuizzes(quizzes: Quiz[]): Observable<boolean> {
    return new Observable<boolean>(observer => {
      for (let i = 0; i < quizzes.length; i++) {
        let shortId = this.buildShortId(quizzes[i].id);
        if (localStorage.getItem(shortId)) {
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
      this.getAllQuizzes().subscribe({
        next: (allQuizzes: AllQuizzes) => {
          let existingQuizzes = allQuizzes.quizzes;
          for(let quiz of quizzes) {
            let existing = existingQuizzes.find(q => q.id === quiz.id);
            if(!existing) {
              let short = new QuizShort();
              short.id = quiz.id;
              short.name = quiz.name;
              short.groups = quiz.groups;
              short.fields = quiz.fields.length;
              short.data = quiz.data.length;

              existingQuizzes.push(short);
            } else {
              existing.name = quiz.name;
              existing.groups = quiz.groups;
              existing.fields = quiz.fields.length;
              existing.data = quiz.data.length;
            }

            this.saveQuizzes(allQuizzes.spreadsheetId, existingQuizzes).subscribe({
              next: () => {
                observer.next(quizzes);
                observer.complete();
              }
            });
          }
        }
      });
    });
  }

  private saveQuizzes(spreadsheetId: string, quizzes: QuizShort[]): Observable<void> {
    return new Observable<void>(observer => {
          let values = [];
          for(let quiz of quizzes) {
            values.push([quiz.id, quiz.groups.join("/"), quiz.name, quiz.passedCount, quiz.fields, quiz.data, quiz.last5AnswerSuccessRate ?? 0, quiz.last10AnswerSuccessRate ?? 0]);
          }

          let body = {
            values: values
          };

          this.httpClient.put(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=RAW`, body).subscribe({
            next: () => {
              observer.next();
              observer.complete();
            }
          });
    });
  }

  public getQuiz(id: string): Observable<Quiz | null> {
    return new Observable<Quiz | null>(observer => {
      let shortId = this.buildShortId(id);
      let dataId = this.buildDataId(id);

      let shortStr = localStorage.getItem(shortId);
      let dataStr = localStorage.getItem(dataId);
      if (shortStr && dataStr) {
        let short = JSON.parse(shortStr);
        let data = JSON.parse(dataStr);

        let quiz = new Quiz(short.id);
        quiz.name = short.name;
        quiz.groups = short.groups;
        quiz.fields = data.fields;
        quiz.data = data.data;

        observer.next(quiz);
      } else {
        observer.next(null);
      }

      observer.complete();
    });
  }

  public getReports(quizId: string): Observable<QuizPassedReport[]> {
    return new Observable<QuizPassedReport[]>(observer => {
      let reportId = this.buildReportId(quizId);
      let reportStr = localStorage.getItem(reportId);
      if (reportStr) {
        let reports = JSON.parse(reportStr);
        for (let i = 0; i < reports.length; i++) {
          reports[i].date = new Date(reports[i].date);
        }

        observer.next(reports);
      } else {
        observer.next([]);
      }
      observer.complete();
    });
  }

  public saveReports(reports: QuizPassedReport[]): Observable<void> {
    return new Observable<void>(observer => {
      for (let i = 0; i < reports.length; i++) {
        this.saveReportSync(reports[i]);
      }
      observer.next();
      observer.complete();
    });
  }

  public saveReport(report: QuizPassedReport): Observable<void> {
    return new Observable<void>(observer => {
      this.saveReportSync(report);
      observer.next();
      observer.complete();
    });
  }

  private saveReportSync(report: QuizPassedReport): void {
    let shortId = this.buildShortId(report.quizId);
    let reportId = this.buildReportId(report.quizId);

    var reportStr = localStorage.getItem(reportId);
    var reportStr = localStorage.getItem(reportId);
    let reports: QuizPassedReport[] = [];
    if (reportStr) {
      reports = JSON.parse(reportStr);
    }

    for (let r of reports) {
      r.date = new Date(r.date);
      if (r.id === report.id) {
        return;
      }
    }

    reports.push(report);

    console.log(reports);
    localStorage.setItem(reportId, JSON.stringify(reports));

    reports.sort((a, b) => b.date.getTime() - a.date.getTime());


    let shortStr = localStorage.getItem(shortId);
    let short: QuizShort = JSON.parse(shortStr!);

    let correctAnswers = [];
    let wrongAnswers = [];

    for (let i = 0; i < 10 && i < reports.length; i++) {
      let correct = this.getAnswersCount(reports[i].questions, a => a.correctAnswer === a.userAnswer);
      let wrong = this.getAnswersCount(reports[i].questions, a => a.correctAnswer !== a.userAnswer);
      correctAnswers.push(correct);
      wrongAnswers.push(wrong);

    }

    short.last10AnswerSuccessRate = this.getSuccessRate(correctAnswers, wrongAnswers, 10);
    short.last5AnswerSuccessRate = this.getSuccessRate(correctAnswers, wrongAnswers, 5);


    short.passedCount++;

    localStorage.setItem(shortId, JSON.stringify(short));


  }

  private getAnswersCount(questions: QuizPassedReportQuestion[], predicate: (a: QuizPassedReportAnswerField) => boolean): number {
    let count = 0;
    for (let i = 0; i < questions.length; i++) {
      for (let j = 0; j < questions[i].answerFields.length; j++) {
        if (predicate(questions[i].answerFields[j])) {
          count++;
        }
      }
    }
    return count;
  }

  public getRootFolder(): Observable<Folder> {
    let rootFolder: Folder = new Folder();
    rootFolder.name = "Quizzer";

    return new Observable<Folder>(observer => {
      this.getAllQuizzes().subscribe({
        next: (data: AllQuizzes) => {
          for (let i = 0; i < data.quizzes.length; i++) {
            this.appendToFolder(rootFolder, data.quizzes[i]);
          }

          observer.next(rootFolder);
          observer.complete();
        }
      });
    });
  }

  private getAllQuizzes(): Observable<AllQuizzes> {
    return new Observable<AllQuizzes>(observer => {
      this.getQuizzerData().subscribe({
        next: (data: QuizzerData) => {
          
          let quizzes: QuizShort[] = [];
          this.httpClient.get(`https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}?includeGridData=true`).subscribe({
            next: (data: any) => {
              if(!data.sheets[0].data[0].rowData) {
                observer.next(new AllQuizzes());
                observer.complete();
                return;
              }

              data.sheets[0].data[0].rowData.forEach((row: any) => {
                let short = new QuizShort();
                short.id = row.values[0].formattedValue;
                short.name = row.values[2].formattedValue;
                short.groups = row.values[1].formattedValue.split("/");
                short.passedCount = row.values[3].effectiveValue.numberValue;
                short.fields = row.values[4].effectiveValue.numberValue;
                short.data = row.values[5].effectiveValue.numberValue;
                short.last5AnswerSuccessRate = row.values[6].effectiveValue.numberValue;
                short.last10AnswerSuccessRate = row.values[7].effectiveValue.numberValue;

                if(row.values[0].formattedValue) {
                  quizzes.push(short);
                }
                
              });

              let allQuizzes = new AllQuizzes();
              allQuizzes.quizzes = quizzes;
              allQuizzes.spreadsheetId = data.spreadsheetId;

              observer.next(allQuizzes);
              observer.complete();
            }
          })
        }
      });
    });
  }

  private appendToFolder(folder: Folder, quiz: QuizShort): void {
    let currentFolder = folder;
    for (let i = 0; i < quiz.groups.length; i++) {
      let subFolder = currentFolder.subFolders.find(f => f.name === quiz.groups[i]);
      if (!subFolder) {
        subFolder = new Folder();
        subFolder.name = quiz.groups[i];
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
    info.id = quiz.id;
    info.name = quiz.name;
    info.fields = quiz.fields;
    info.data = quiz.data;
    info.passedCount = quiz.passedCount;
    info.last10AnswerSuccessRate = quiz.last10AnswerSuccessRate;
    info.last5AnswerSuccessRate = quiz.last5AnswerSuccessRate;

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

  private getSuccessRate(correct: number[], wrong: number[], count: number): number | undefined {
    if (!correct || !wrong) {
      return undefined;
    }

    if (correct.length === 0 && wrong.length === 0) {
      return undefined;
    }

    let correctSum = 0;
    let wrongSum = 0;
    for (let i = 0; i < count && i < correct.length; i++) {
      correctSum += correct[i];
      wrongSum += wrong[i];
    }

    let sum = correctSum + wrongSum;
    if (sum === 0) {
      return undefined;
    }

    console.log(correctSum, wrongSum, sum);

    return correctSum / sum;
  }

  public getQuizzes(group: string[]): Observable<Quiz[]> {
    for (let i = 0; i < group.length; i++) {
      if (group[i] === "") {
        group.splice(i, 1);
        i--;
      }
    }

    return new Observable<Quiz[]>(observer => {
      let quizzes: Quiz[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && key.startsWith(this.shortPrefix)) {
          let quizStr = localStorage.getItem(key);
          if (quizStr) {
            let short: QuizShort = JSON.parse(quizStr);
            if (group.length > 0 && !this.isSubGroup(short.groups, group)) {
              continue;
            }

            let data: QuizData = JSON.parse(localStorage.getItem(this.buildDataId(short.id))!);
            let quiz = new Quiz(short.id);
            quiz.name = short.name;
            quiz.groups = short.groups;
            quiz.fields = data.fields;
            quiz.data = data.data;

            quizzes.push(quiz);
          }
        }
      }

      observer.next(quizzes);
      observer.complete();
    });
  }

  public deleteQuiz(id: string): Observable<void> {
    let shortId = this.buildShortId(id);
    let dataId = this.buildDataId(id);
    return new Observable<void>(observer => {
      localStorage.removeItem(shortId);
      localStorage.removeItem(dataId);
      observer.next();
      observer.complete();
    });
  }

  private getQuizzerData(): Observable<QuizzerData> {
    return new Observable<QuizzerData>(observer => {
      let quizzerFolderId = sessionStorage.getItem("quizzerFolderId");
      let quizzerSpreadsheetId = sessionStorage.getItem("quizzerSpreadsheetId");

      if (quizzerFolderId && quizzerSpreadsheetId) {
        let data = new QuizzerData();
        data.folderId = quizzerFolderId;
        data.spreadsheetId = quizzerSpreadsheetId;
        observer.next(data);
        observer.complete();
      } else {
        this.httpClient.get("https://www.googleapis.com/drive/v3/files?q=name contains 'Quizzer'&fields=files(id, name, parents, mimeType)")
          .subscribe((data: any) => {
            let folder = data.files.find((f: any) => f.mimeType === "application/vnd.google-apps.folder" && f.name === "Quizzer");
            if (folder) {
              quizzerFolderId = folder.id;
              sessionStorage.setItem("quizzerFolderId", folder.id);

              let spreadsheet = data.files.find((f: any) => f.mimeType === "application/vnd.google-apps.spreadsheet" && f.name === "Quizzer" && f.parents && f.parents.includes(folder.id));
              if (spreadsheet) {
                quizzerSpreadsheetId = spreadsheet.id;
                sessionStorage.setItem("quizzerSpreadsheetId", spreadsheet.id);
              }
            }
          });
      }
    });
  }

  private buildShortId(id: string): string {
    return this.shortPrefix + id;
  }

  private buildDataId(id: string): string {
    return this.dataPrefix + id;
  }

  private buildReportId(id: string): string {
    return this.reportPrefix + id;
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
