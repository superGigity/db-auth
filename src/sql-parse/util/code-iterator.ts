export class codeIterator{
  code: string;
  lineCode: string = '';
  readIndex: number = -1;
  constructor(code: string){
    this.code = code;
  }

  next(){
    this.readIndex++;
    this.lineCode += this.code[this.readIndex];
  }
  freere(){
    this.lineCode = '';
  }
  isStop(){
    return this.readIndex >= this.code.length;
  }
  stop(){
    return this.readIndex == this.code.length;
  }
}