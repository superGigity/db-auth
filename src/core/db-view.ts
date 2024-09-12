import { TFieldAuth } from "../type/auth";

/*
    视图管理类,添加视图,返回视图唯一ID
    维护框架生产的临时视图,记录性能信息
*/
export class DbViewAuth{
    #fieldAuthSql:String = '*';
    #tableName:string;
    #queryAction:(sql:string)=>boolean;
    constructor(tableName:string,querAction: (sql:string) => boolean){
        this.#tableName = tableName;
        this.#queryAction = querAction;
    }
    setFieldAuth(fieldAuth:Record<string,TFieldAuth>){
        const setFieldSql = [];

        for(const key in fieldAuth){
            const item = fieldAuth[key];
            if(item === 'noPermission')return;

            setFieldSql.push(item);
        }

        this.#fieldAuthSql = setFieldSql.join(',');
    }
    generateView(){
        const viewSql = `CREATE VIEW AS SELECT ${this.#fieldAuthSql} FROM ${this.#tableName}`;
        console.log(viewSql,this.#queryAction(viewSql));
        return '111';
    }
} 
