import { Injectable } from '@angular/core';
import { Field, Folder, Quiz, QuizInfo, QuizPassedReport, QuizPassedReportAnswerField, QuizPassedReportQuestion } from '../models/quiz';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  private shortPrefix: string = "short/";
  private dataPrefix: string = "data/";
  private reportPrefix: string = "report/";

  constructor() { }

  public hasDublicateQuizzes(quizzes: Quiz[]) : Observable<boolean> {
    return new Observable<boolean>(observer => {
      for(let i = 0; i < quizzes.length; i++){
        let shortId = this.buildShortId(quizzes[i].id);
        if(localStorage.getItem(shortId)) {
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
        let shortId = this.buildShortId(quizzes[i].id);
        let dataId = this.buildDataId(quizzes[i].id);

        let shortQuiz = new QuizShort();
        shortQuiz.id = quizzes[i].id;
        shortQuiz.name = quizzes[i].name;
        shortQuiz.groups = quizzes[i].groups;
        shortQuiz.fields = quizzes[i].fields.length;
        shortQuiz.data = quizzes[i].data.length;

        let quizData = new QuizData();
        quizData.fields = quizzes[i].fields;
        quizData.data = quizzes[i].data;

        localStorage.setItem(shortId, JSON.stringify(shortQuiz));
        localStorage.setItem(dataId, JSON.stringify(quizData));
      }
      observer.next(quizzes);
      observer.complete();
    });
  }

  public getQuiz(id: string): Observable<Quiz | null> {
    return new Observable<Quiz | null>(observer => {
      let shortId = this.buildShortId(id);
      let dataId = this.buildDataId(id);
    
      let shortStr = localStorage.getItem(shortId);
      let dataStr = localStorage.getItem(dataId);
      if(shortStr && dataStr){
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
      if(reportStr){
        let reports = JSON.parse(reportStr);
        for(let i = 0; i < reports.length; i++){
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
      for(let i = 0; i < reports.length; i++){
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
    if(reportStr){
      reports = JSON.parse(reportStr);
    }

    for(let r of reports) {
      if(r.id === report.id){
        return;
      }
    }

    let shortStr = localStorage.getItem(shortId);
    let short: QuizShort = JSON.parse(shortStr!);

    let correctAnswersCount = this.getAnswersCount(report.questions, a => a.correctAnswer === a.userAnswer);
    let wrongAnswersCount = this.getAnswersCount(report.questions, a => a.correctAnswer !== a.userAnswer);

    let correctQuestionsCount = this.getQuestionsCount(report.questions, a => a.correctAnswer === a.userAnswer);
    let wrongQuestionsCount = report.questions.length - correctQuestionsCount;

    if(!short.lastCorrectAnswers) {
      short.lastCorrectAnswers = [];
    }

    if(!short.lastWrongAnswers) {
      short.lastWrongAnswers = [];
    }

    if(!short.lastCorrectQuestions) {
      short.lastCorrectQuestions = [];
    }

    if(!short.lastWrongQuestions) {
      short.lastWrongQuestions = [];
    }

    short.passedCount++;

    short.lastCorrectAnswers.push(correctAnswersCount);
    short.lastWrongAnswers.push(wrongAnswersCount);

    short.lastCorrectQuestions.push(correctQuestionsCount);
    short.lastWrongQuestions.push(wrongQuestionsCount);

    localStorage.setItem(shortId, JSON.stringify(short));



    reports.push(report);

    localStorage.setItem(reportId, JSON.stringify(reports));
  }

  private getQuestionsCount(questions: QuizPassedReportQuestion[], predicate: (a: QuizPassedReportAnswerField) => boolean): number {
    let count = 0;
    for(let i = 0; i < questions.length; i++){
      let correct = true;
      for(let j = 0; j < questions[i].answerFields.length; j++){
        if(!predicate(questions[i].answerFields[j])){
          correct = false;
          break;
        }
      }

      if(correct){
        count++;
      }
    }

    return count;
  }

  private getAnswersCount(questions: QuizPassedReportQuestion[], predicate: (a: QuizPassedReportAnswerField) => boolean): number {
    let count = 0;
    for(let i = 0; i < questions.length; i++){
      for(let j = 0; j < questions[i].answerFields.length; j++){
        if(predicate(questions[i].answerFields[j])){
          count++;
        }
      }
    }
    return count;
  }

  public getRootFolder(): Observable<Folder> {
    return new Observable<Folder>(observer => {
      let rootFolder: Folder = new Folder();
      rootFolder.name = "Quizzer";

      for(let i = 0; i < localStorage.length; i++){
        let key = localStorage.key(i);
        if(key && key.startsWith(this.shortPrefix)){
          let quiz = localStorage.getItem(key);
          if(quiz){
            let short: QuizShort = JSON.parse(quiz);
            this.appendToFolder(rootFolder, short);
          }
        }
      }

      observer.next(rootFolder);
      observer.complete();
    });
  }

  private appendToFolder(folder: Folder, quiz: QuizShort): void {
    let currentFolder = folder;
    for(let i = 0; i < quiz.groups.length; i++){
      let subFolder = currentFolder.subFolders.find(f => f.name === quiz.groups[i]);
      if(!subFolder){
        subFolder = new Folder();
        subFolder.name = quiz.groups[i];
        currentFolder.subFolders.push(subFolder);

        currentFolder.subFolders.sort((a, b) => {
          if(a.name < b.name){
            return -1;
          } else if(a.name > b.name){
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
    info.last10AnswerSuccessRate = this.getSuccessRate(quiz.lastCorrectAnswers, quiz.lastWrongAnswers, 10);
    info.last10QuestionSuccessRate = this.getSuccessRate(quiz.lastCorrectQuestions, quiz.lastWrongQuestions, 10);

    currentFolder.quizzes.push(info);

    currentFolder.quizzes.sort((a, b) => {
      if(a.name < b.name){
        return -1;
      } else if(a.name > b.name){
        return 1;
      } else {
        return 0;
      }
    });
  }

  private getSuccessRate(correct: number[], wrong: number[], count: number): number | undefined {
    if(!correct || !wrong){
      return undefined;
    }

    if(correct.length === 0 && wrong.length === 0){
      return undefined;
    }

    let correctSum = 0;
    for(let i = correct.length - 1; i >= 0 && i >= correct.length - count; i--){
      correctSum += correct[i];
    }

    let wrongSum = 0;
    for(let i = wrong.length - 1; i >= 0 && i >= wrong.length - count; i--){
      wrongSum += wrong[i];
    }

    let sum = correctSum + wrongSum;
    if(sum === 0){
      return undefined;
    }

    return correctSum / sum;
  }

  public getQuizzes(group: string[]): Observable<Quiz[]> {
    for(let i = 0; i < group.length; i++){
      if(group[i] === ""){
        group.splice(i, 1);
        i--;
      }
    }
    
    return new Observable<Quiz[]>(observer => {
      let quizzes: Quiz[] = [];
      for(let i = 0; i < localStorage.length; i++){
        let key = localStorage.key(i);
        if(key && key.startsWith(this.shortPrefix)){
          let quizStr = localStorage.getItem(key);
          if(quizStr){
            let short: QuizShort = JSON.parse(quizStr);
            if(group.length > 0 && !this.isSubGroup(short.groups, group)){
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
    if(groups.length < group.length){
      return false;
    }

    for(let i = 0; i < group.length; i++){
      if(groups[i] !== group[i]){
        return false;
      }
    }

    return true;
  }
}

class QuizShort {
  public id: string = "";
  public name: string = "";
  public groups: string[] = [];
  public fields: number = 0;
  public data: number = 0;

  public passedCount: number = 0;

  public lastCorrectAnswers: number[] = [];
  public lastWrongAnswers: number[] = [];

  public lastCorrectQuestions: number[] = [];
  public lastWrongQuestions: number[] = [];
}

class QuizData {
  public fields: Field[] = [];
  public data: any[] = [];
}
