
import { TokenEnum, TokenEnumType } from "./token/main";
// import { codeIterator } from "./util/code-iterator";

export interface sqlAst{
  type: TokenEnumType;
  value: string;
  otherValue: string;
  children: sqlAst[];
  start: number;
  end: number;
}
export const parse = function(code: string){
  const tokenTree = [];
  console.time('Run Match Token');
  for(const key  in TokenEnum){
    const item = TokenEnum[key as keyof typeof TokenEnum];
    const match = new RegExp(item,'gi');
    const matchToken = Array.from(code.matchAll(match));
    const pushAst: sqlAst[] = matchToken.map((v)=>{
      return {
        type: key as TokenEnumType,
        value: '',
        otherValue:'',
        children:[],
        start:v.index,
        end:0
      }
    });

    tokenTree.push(...pushAst);
  }
  const sortTokenTree = tokenTree.sort((a,b)=>{
    return a.start - b.start;
  });
  console.log(sortTokenTree);
  console.timeEnd('Run Match Token');
}