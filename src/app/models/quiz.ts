export class Quiz {
    public name: string = "";
    public fields: Field[] = [];
    public data: any[] = [];
}

export class Field {
    public name: string = "";
    public type: FieldType = FieldType.Text;
}

export enum FieldType {
    Text = "text",
}