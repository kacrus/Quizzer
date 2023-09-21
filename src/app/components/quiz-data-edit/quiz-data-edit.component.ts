import { Component, Input } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-quiz-data-edit',
  templateUrl: './quiz-data-edit.component.html',
  styleUrls: ['./quiz-data-edit.component.scss']
})
export class QuizDataEditComponent {
  @Input({ required: true }) public quiz!: Quiz;

  protected quizName: string = "";
  protected columns: Column[] = [];
  protected rows: any[] = [];

  ngOnInit(): void {
    this.quizName = this.quiz.name;
    this.columns = this.quiz.fields.map(f => new Column(f.name));
    for(let question of this.quiz.data){
      let row:any = {};
      for(let column of this.columns){
        row[column.id] = question[column.name];
      }

      this.rows.push(row);
    }
  }

  public addColumn(): void {
    let column = new Column("");
    this.columns.push(column);

    for(let row of this.rows){
      row[column.id] = "";
    }
  }

  public deleteColumn(column: Column): void {
    let index = this.columns.indexOf(column);
    if(index > -1){
      this.columns.splice(index, 1);
    }

    for(let row of this.rows){
      delete row[column.id];
    }
  }

  public addRow(): void {
    let row:any = {};
    for(let column of this.columns){
      row[column.id] = "";
    }

    this.rows.push(row);
  }

  public deleteRow(row: any): void {
    let index = this.rows.indexOf(row);
    if(index > -1){
      this.rows.splice(index, 1);
    }
  }

  public canSave(): boolean {
    if (this.quizName == "") {
      return false;
    }

    // any column name is empty or duplicated
    let columnNames = this.columns.map(c => c.name);
    if(columnNames.some(c => c == "")){
      return false;
    }

    let uniqueColumnNames = [...new Set(columnNames)];
    if(uniqueColumnNames.length != columnNames.length){
      return false;
    }

    // if any rows
    return this.rows.length > 0;
  }

  public downloadFile(): void {
    let json: string = this.getJson();

    let anchorElem: HTMLAnchorElement = document.createElement('a');
    var file = new Blob([json], {type: "text/plain"});
    anchorElem.href = URL.createObjectURL(file);
    anchorElem.download = `${this.quizName}.json`;
    anchorElem.click();

  }

  private getJson(): string {
    let rowObjects: any[] = [];

    for(let row of this.rows){
      let jsonObject: any = {};
      for(let column of this.columns){
        jsonObject[column.name] = row[column.id];
      }

      rowObjects.push(jsonObject);
    }

    let quiz: Quiz = {
      name: this.quizName,
      fields: this.quiz.fields,
      data: rowObjects
    };

    return JSON.stringify(quiz, null, 2);
  }
}

class Column {
  constructor(name: string) {
    this.id = uuid();
    this.name = name;
  }

  public id: string;
  public name: string;
}
