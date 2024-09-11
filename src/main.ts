import { DbViewAuth } from "./core/db-view";
import { TFieldAuth } from "./type/auth";

export class DbAuth{
    #condition:Record<string,string[]> = {};
    #field:Record<string,Record<string,string>> = {};

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

    getExecSql(sqlCode:string,actionTable:string[]){
        let resultSql = sqlCode;
        const cacheView:Record<string,DbViewAuth | null> = {};

        // Created View
        for(const tableName of actionTable){
            const condition = this.#condition[tableName];
            const field = this.#field[tableName];
            if(!condition && !field){
                cacheView[tableName] = null;
            }else{
                cacheView[tableName] = new DbViewAuth(tableName);
            }
        }
        // Replace Sql
        for(const key in cacheView){
            const item = cacheView[key];
            if(item){
                resultSql = resultSql.replace(new RegExp(key,'g'),item.startAuthView());
            }
        }
        return resultSql;
    }
}