import { createHash } from "crypto";
import { TFieldAuth } from "../type/auth";

/*
    视图管理类,添加视图,返回视图唯一ID
    维护框架生产的临时视图,记录性能信息
*/
export class DbViewAuth{
    #fieldAuthSql:string = '*';
    #condition:string = '';

    #tableName:string;
    #queryAction:(sql:string)=>Promise<boolean>;
    constructor(tableName:string,querAction: (sql:string) => Promise<boolean>){
        this.#tableName = tableName;
        this.#queryAction = querAction;
    }
    setFieldAuth(fieldAuth:Record<string,TFieldAuth>){
        const setFieldSql = [];

        for(const key in fieldAuth){
            const item = fieldAuth[key];
            if(item === TFieldAuth.noAuth)return;

            setFieldSql.push(key);
        }

        this.#fieldAuthSql = setFieldSql.join(',');
    }
    setCondition(condition:string[]){
        if(condition)
            this.#condition = condition.join(' OR ');
    }
    generateViewId(){
        // init View Id By Condition and fieldAuthSql
        const viewIdStr = this.#fieldAuthSql + this.#condition;

        return createHash('md5').update(viewIdStr).digest('hex');
    }
    async generateView(){
        const viewId = this.generateViewId();
        let viewSql = `CREATE VIEW \`${viewId}\` AS SELECT ${this.#fieldAuthSql} FROM ${this.#tableName}`;
        if(this.#condition){
            viewSql += ` WHERE ${this.#condition}`;
        }
        console.log(viewSql);
        const AddView = await this.#queryAction(viewSql);

        if(AddView){
            return viewId;
        }
        return this.#tableName;
    }
} 
