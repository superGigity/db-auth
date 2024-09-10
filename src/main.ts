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

    getExecSql(sqlCode:string){
        let resultSql = sqlCode;
        const authTable = 'user_view';

        for(let key in this.#condition){
            resultSql = resultSql.replace(new RegExp(key,'g'),`${authTable}`);
        }
        return resultSql;
    }
}