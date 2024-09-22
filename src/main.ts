import { DbViewAuth } from "./core/db-view";
import { TFieldAuth } from "./type/auth";
import { MySQLError } from "./type/mysql";
import { TableAuth } from "./type/table";

type patchDataRule = {
    [key in string] : { tableName:string,handle:(data:any)=>any }
}
export class DbAuth{
    #queryAction:(sqlCode:string)=>Promise<boolean>;
    #condition:Record<string,string[]> = {};
    #field:Record<string,Record<string,TFieldAuth>> = {};

    #viewManger: Record<string,DbViewAuth | null> = {};
    #viewHashManger:Record<string,string> = {};
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
        const patchTable = (target: string) => new RegExp(`(?<!['"\s])(${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[\\s\`;\.,]|$)`, 'g');
        // Replace Sql
        for(const tableName in cacheView){
            const item = cacheView[tableName];
            if(item){
                resultSql = resultSql.replace(patchTable(tableName),'`'+ await item.generateView() +'`');
                this.#viewHashManger[item.generateViewId()] = tableName;
            }
        }
        this.#viewManger = cacheView;
        return resultSql;
    }
    resultData(data:any[],rules:patchDataRule = {}){
        // 获取无权限字段
        const noAuthField = function(field: Record<string,Record<string,TFieldAuth>>){
            const resultNoAuthField:{ field:string;table:string }[] = [];
            for(const tableKey in field){
                const tableitem = field[tableKey];
                for(const fieldItemKey in tableitem){
                    const tableFieldItem = tableitem[fieldItemKey];
                    if(tableFieldItem === TFieldAuth.hide){
                        resultNoAuthField.push({ field:fieldItemKey,table:tableKey });
                    }
                }
            }
            return resultNoAuthField;
        }
        const noAuthFieldArray = noAuthField(this.#field);
        console.log(noAuthFieldArray);
        const resultData = data.map((item) => {
            for(const noAuthItem of noAuthFieldArray){
                if(rules[noAuthItem.field] && rules[noAuthItem.field].tableName === noAuthItem.table){
                    // has patch rules.
                    item[noAuthItem.field] = rules[noAuthItem.field].handle(item[noAuthItem.field]);
                    break;
                }

                if(!rules[noAuthItem.field] && item[noAuthItem.field]){
                    item[noAuthItem.field] = '';
                }
            }
            return item;
        });

        return resultData;
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

        function resultError_ER_BAD_FIELD_ERROR(_this:DbAuth,error: MySQLError){
            const field = _this.resultField(error);

            const fielGroup = field.split('.');

            const [ viewName,fieldName ] = fielGroup;
            
            const replaceTableField = _this.resultField(error,true);
            const patchTableField = function(fieldName:string,field:Record<string,Record<string,TFieldAuth>>,tableName:string = ''){
                const patchTableResult:boolean[] = [];
                if(tableName){
                    const tableField = field[tableName];
                    const tableFieldHas = Object.keys(tableField);
                    patchTableResult.push(tableFieldHas.indexOf(fieldName) != -1);
                }else{
                    for(const key in field){
                        const tableField = field[key];
                        const tableFieldHas = Object.keys(tableField);
        
                        patchTableResult.push(tableFieldHas.indexOf(fieldName) != -1);
                    }
                }
                return patchTableResult.filter(Boolean).length || 0;
            };
            for(const tableName in _this.#viewManger){
                const item = _this.#viewManger[tableName];
                if(item){
                    error.message = error.message.replace(item?.generateViewId(),tableName);
                }
                if(item && item.generateViewId() == viewName){
                    // patch Table View.
                    const findField = patchTableField(fieldName,_this.#field,tableName);

                    if(!findField){
                        // not in table field.
                        return resultError(error.message);
                    }

                    if(findField == 1){
                        // path success
                        return resultError(`You do not have access to this field \`${replaceTableField}\``);
                    }
                    continue;
                }
            }


            // path all table find field.

            const findField = patchTableField(fieldName,_this.#field);

            if(!findField){
                // not in table field.
                return resultError(error.message);
            }
            
            if(findField > 1){
                return resultError(`The field '${field}' is ambiguous.`)
            }

            return resultError(error.message);
        }

        const field = this.resultField(error,true);
        switch (error.code) {
            case 'ER_BAD_FIELD_ERROR':
                return resultError_ER_BAD_FIELD_ERROR(this,error);
            case 'ER_NONUPDATEABLE_COLUMN':
                return resultError(`The field '${field}' is read-only and cannot be modified`)
            case 'ER_VIEW_CHECK_FAILED':
                return resultError('You do not have the authority to perform this operation');
            default:
                return resultError(error.message);
        }
    }
    resultField(error:MySQLError,replaceTable:boolean = false){
        let resultField = '';
        switch (error.code) {
            default:
                const regEXP = /'(.*?)'/g;
                const fieldArr = error.message.match(regEXP);
                resultField = (fieldArr?.[0] || '').replace(regEXP,'$1');
                break;
        }
        if(replaceTable){
            for(const viewName in this.#viewHashManger){
                const tableName = this.#viewHashManger[viewName];
                resultField = resultField.replace(new RegExp(viewName,'g'),tableName);
            }
        }
        return resultField;
    }
}