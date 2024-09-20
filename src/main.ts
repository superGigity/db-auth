import { DbViewAuth } from "./core/db-view";
import { TFieldAuth } from "./type/auth";
import { MySQLError } from "./type/mysql";
import { TableAuth } from "./type/table";

export class DbAuth{
    #queryAction:(sqlCode:string)=>Promise<boolean>;
    #condition:Record<string,string[]> = {};
    #field:Record<string,Record<string,TFieldAuth>> = {};
    constructor(queryAction:(sqlCode:string)=>Promise<boolean>){
        this.#queryAction = queryAction;
    }
    setCondition(tableName:string,rules:string[]){
        if(!this.#condition[tableName]){
            this.#condition[tableName] = [];
        }
        this.#condition[tableName] = rules;
    }

    setFieldAuth<T extends TableAuth>(table:T,fieldHash:{
        [k in keyof T]?:TFieldAuth
    }){
        if(!this.#field[table.tableName]){
            this.#field[table.tableName] = {};
        }
        for(const key in fieldHash){
            const item = fieldHash[key];
            if(item)
                this.#field[table.tableName][key] = item;
        }
    }

    async getAuthSql(sqlCode:string,actionTable:string[]){
        let resultSql = sqlCode;
        const cacheView:Record<string,DbViewAuth | null> = {};

        // Created View
        for(const tableName of actionTable){
            const condition = this.#condition[tableName];
            const field = this.#field[tableName];
            if(!condition && !field){
                cacheView[tableName] = null;
            }else{
                cacheView[tableName] = new DbViewAuth(tableName,this.#queryAction);
                cacheView?.[tableName]?.setCondition(condition);
                cacheView?.[tableName]?.setFieldAuth(field)
            }
        }
        const patchTable = (target: string) => new RegExp(`(?<!['"\s])(${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[\\s\`;\.]|$)`, 'g');
        // Replace Sql
        for(const key in cacheView){
            const item = cacheView[key];
            if(item){
                resultSql = resultSql.replace(patchTable(key),'`'+ await item.generateView() +'`');
            }
        }
        return resultSql;
    }

    resultError(error:MySQLError,throwError:boolean = true){
        // 根据报错和字段权限返回正确的 错误信息
        console.log(error.message);
        console.log(error.code);
        function resultError(errorMsg:string){
            if(throwError){
                throw new Error(errorMsg);
            }

            return { errorMsg: errorMsg }
        }
        switch (error.code) {
            case 'ER_BAD_FIELD_ERROR':
                const regex = /Unknown column '(.*)' in/i;
                const match = error.message.match(regex);
                const fieldName = match?.[1] || '';
                return resultError(`You do not have access to the field '${fieldName}'`)
            case 'ER_NONUPDATEABLE_COLUMN':
                return resultError(`The field is read-only and cannot be modified`);
            case 'ER_VIEW_CHECK_FAILED':
                return resultError('You do not have the authority to perform this operation');
            default:
                return resultError(error.message);
        }
    }
}