import { TFieldAuth } from "../type/auth";

/*
    视图管理类,添加视图,返回视图唯一ID
    维护框架生产的临时视图,记录性能信息
*/
export class DbViewAuth{
    #fieldAuthSql:String = '*';
    constructor(tableName:string,querAction: () => boolean){
        
    }
    setFieldAuth(fieldAuth:Record<string,TFieldAuth>){
        const setFieldSql = [];

        for(const key in fieldAuth){
            const item = fieldAuth[key];
            if(item === 'noPermission')return;
            
        }
    }
    generateView(){
        const viewSql = `CREATE VIEW AS SELECT FROM WHERE`;
    }
    startAuthView(){
        return '312313123';
    }
}