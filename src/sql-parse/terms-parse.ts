import { selectParse } from "./select";
import type { sqlEnum } from "./type/sql-type";
import { codeIterator } from "./util/code-iterator";

export interface sqlAst{
  type: sqlEnum;
  value: string;
  otherValue: string;
  children: sqlAst[];
  parameter: Array<string | sqlAst>
}
export const parse = function(code: string){
  const astTree: sqlAst[] = [];
  const currentCodeIterator = new codeIterator(code);
  
  console.time("parse");
  while(!currentCodeIterator.isStop()){
    console.log(currentCodeIterator.lineCode.toUpperCase());
    switch(currentCodeIterator.lineCode.toUpperCase()){
      case 'SELECT':
        currentCodeIterator.freere();
        selectParse(currentCodeIterator,astTree);
        break;
      case ' ':
        currentCodeIterator.freere();
        currentCodeIterator.next();
        break;
      default:
        currentCodeIterator.next();
        break;
    }
  }
  console.timeEnd('parse');
  console.log(astTree);
}