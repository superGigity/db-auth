import type { sqlAst } from "./terms-parse";
import { sqlEnum } from "./type/sql-type";
import type { codeIterator } from "./util/code-iterator";

export const selectParse = function(currentCodeIterator: codeIterator,currentSqlAst: sqlAst[]){
  const currentAst: sqlAst = {
    type: sqlEnum.SELECT,
    value: "",
    otherValue: "",
    children: [],
    parameter: []
  }
  const selectAst:sqlAst[] = [];
  switch(currentCodeIterator.lineCode){
    case 'FROM':
      break;
  }
  currentAst.children = selectAst;
  currentSqlAst.push(currentAst);
  console.log('触发');
}