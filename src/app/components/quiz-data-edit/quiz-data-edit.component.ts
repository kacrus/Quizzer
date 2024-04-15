import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FieldType, Quiz } from 'src/app/models/quiz';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-quiz-data-edit',
  templateUrl: './quiz-data-edit.component.html',
  styleUrls: ['./quiz-data-edit.component.scss']
})
export class QuizDataEditComponent {
  @Input({ required: true }) public quiz!: Quiz;
  @Input() public isSaving: boolean = false;
  @Output() public onQuizSaved: EventEmitter<Quiz> = new EventEmitter();

  private readonly separator: string = "/";

  protected quizName: string = "";
  protected quizGroup: string = "";
  protected specialCharacters: string = "";
  protected columns: Column[] = [];
  protected rows: any[] = [];

  constructor(
  ) { }

  ngOnInit(): void {
    this.quizName = this.quiz.name;
    this.quizGroup = this.quiz.groups.join(this.separator);
    this.specialCharacters = this.quiz.specialCharacters.join(this.separator);
    this.columns = this.quiz.fields.map(f => new Column(f.id, f.name));
    for (let question of this.quiz.data) {
      let row: any = {};
      for (let column of this.columns) {
        row[column.id] = question[column.id];
      }

      this.rows.push(row);
    }
  }

  public addColumn(): void {
    let column = new Column(uuid(), "");
    this.columns.push(column);

    for (let row of this.rows) {
      row[column.id] = "";
    }
  }

  public deleteColumn(column: Column): void {
    let index = this.columns.indexOf(column);
    if (index > -1) {
      this.columns.splice(index, 1);
    }

    for (let row of this.rows) {
      delete row[column.id];
    }
  }

  public addRow(): void {
    let row: any = {};
    for (let column of this.columns) {
      row[column.id] = "";
    }

    this.rows.push(row);
  }

  public deleteRow(row: any): void {
    let index = this.rows.indexOf(row);
    if (index > -1) {
      this.rows.splice(index, 1);
    }
  }

  public canSave(): boolean {
    if (this.quizName == "") {
      return false;
    }

    // any column name is empty or duplicated
    let columnNames = this.columns.map(c => c.name);
    if (columnNames.some(c => c == "")) {
      return false;
    }

    let uniqueColumnNames = [...new Set(columnNames)];
    if (uniqueColumnNames.length != columnNames.length) {
      return false;
    }

    // if any rows
    return this.rows.length > 0;
  }

  public saveFile(): void {
    let quiz: Quiz = this.getQuizFromUi();
    this.onQuizSaved.emit(quiz);
  }

  public downloadFile(): void {
    let json: string = this.getJson();

    let anchorElem: HTMLAnchorElement = document.createElement('a');
    var file = new Blob([json], { type: "text/plain" });
    anchorElem.href = URL.createObjectURL(file);
    anchorElem.download = `${this.quizName}.json`;
    anchorElem.click();

  }

  private getQuizFromUi(): Quiz {
    let rowObjects: any[] = [];

    for (let row of this.rows) {
      let jsonObject: any = {};
      for (let column of this.columns) {
        jsonObject[column.id]  = row[column.id];
      }

      rowObjects.push(jsonObject);
    }

    let quiz: Quiz = new Quiz(this.quiz.id);
    quiz.name = this.quizName;
    if (this.quizGroup != "") {
      quiz.groups = this.quizGroup.split(this.separator);
    } else {
      quiz.groups = []; 
    }

    if(this.specialCharacters !== "") {
      quiz.specialCharacters = this.specialCharacters.split(this.separator);
    } else {
      quiz.specialCharacters = [];
    }

    quiz.fields = this.columns.map(c => ({ id: c.id, name: c.name, type: FieldType.Text }));
    quiz.data = rowObjects;

    return quiz;
  }

  private getJson(): string {
    let rowObjects: any[] = [];

    for (let row of this.rows) {
      let jsonObject: any = {};
      for (let column of this.columns) {
        jsonObject[column.name] = row[column.id];
      }

      rowObjects.push(jsonObject);
    }

    let quiz: Quiz = new Quiz(this.quiz.id);
    quiz.name = this.quizName;
    quiz.fields = this.columns.map(c => ({ id: c.id, name: c.name, type: FieldType.Text }));
    quiz.data = rowObjects;

    return JSON.stringify(quiz, null, 2);
  }
}

class Column {
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public id: string;
  public name: string;
}
