import { createHash } from "crypto";
import { TFieldAuth } from "../type/auth";
import { MySQLError } from "../type/mysql";

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
            if(item === TFieldAuth.noAuth){
                continue;
            }
            if(item === TFieldAuth.readOnly){
                // set field readonly
                setFieldSql.push(`'' + ${key} as ${key}`);
                continue;
            }
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
        let viewSql = `
            CREATE VIEW \`${viewId}\` AS SELECT ${this.#fieldAuthSql} FROM ${this.#tableName}
        `;
        if(this.#condition){
            viewSql += ` WHERE ${this.#condition}`;
        }

        viewSql += ` WITH CASCADED CHECK OPTION`;


        try{
            const dropViewResult = await this.#queryAction(`DROP VIEW IF EXISTS \`${viewId}\``);

            if(!dropViewResult){
                return this.#tableName;
            }
            
            const addViewResult = await this.#queryAction(viewSql);
            
            return addViewResult ? viewId : this.#tableName;
            
        }catch(error){
            throw new Error(this.resultError(error as MySQLError));
        }
        
    }

    resultError(sqlError:MySQLError){
        switch (sqlError.code) {
            case 'ER_TABLEACCESS_DENIED_ERROR':
                return 'You do not have permission to access the corresponding table';
            case 'ER_TABLE_EXISTS_ERROR':
                return 'Failed to build permission view';
            case 'ER_VIEW_INVALID':
                return 'Permission view has expired';
            default:
                return sqlError.message;
        }
    }
} 
