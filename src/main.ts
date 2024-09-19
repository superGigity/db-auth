import { DbViewAuth } from "./core/db-view";
import { TFieldAuth } from "./type/auth";

export class DbAuth{
    #queryAction:()=>Promise<boolean>;
    #condition:Record<string,string[]> = {};
    #field:Record<string,Record<string,TFieldAuth>> = {};
    constructor(queryAction:()=>Promise<boolean>){
        this.#queryAction = queryAction;
    }
    setCondition(tableName:string,rules:string[]){
        if(!this.#condition[tableName]){
            this.#condition[tableName] = [];
        }
        this.#condition[tableName] = rules;
    }

    setFieldAuth(tableName:string,fieldName:string,rules:TFieldAuth){
        if(!this.#field[tableName]){
            this.#field[tableName] = {};
        }
        if(!this.#field[tableName][fieldName]){
            this.#field[tableName][fieldName] = rules;
        }
        this.#field[tableName][fieldName] = rules;
    }

    async getExecSql(sqlCode:string,actionTable:string[]){
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
        const patchTable = (target:string) => new RegExp(`(${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[\\s\`;]|$)`, 'g');
        // Replace Sql
        for(const key in cacheView){
            const item = cacheView[key];
            if(item){
                resultSql = resultSql.replace(patchTable(key),await item.generateView());
            }
        }
        return resultSql;
    }
}