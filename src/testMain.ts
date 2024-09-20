import { createConnection } from "mysql2/promise";
import { DbAuth } from "./main";
import { TFieldAuth } from "./type/auth";
import { MySQLError } from "./type/mysql";
import { TableAuth } from "./type/table";

class userModal implements TableAuth{
    tableName: string = 'user';

    id: number | undefined;

    username:string | undefined;
    
    password:string | undefined;

    age:number | undefined;

    sex:number | undefined;
}
async function queryData() {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'test_db_auth'
  });
  const sqlAuth = new DbAuth(async (viewSql:string)=>{
    const [ rows ] = await connection.execute(viewSql);
    return (rows as any).serverStatus == 2 ? true : false;
  });
  
  sqlAuth.setFieldAuth<userModal>(new userModal(),{
      'id': TFieldAuth.allow,
      'age': TFieldAuth.allow,
      'username' : TFieldAuth.allow,
      'password' : TFieldAuth.allow,
      'sex' : TFieldAuth.noAuth
  });

  // 只能管理age 大于400的数据
  sqlAuth.setCondition('user',['age > 400']);
  const authSql = await sqlAuth.getAuthSql('select user.sex from user',[
    'user'
  ]);
  try{
    const [ row ] = await connection.query(authSql);
    console.log(row);
  }catch(error){
    sqlAuth.resultError(error as MySQLError);
  }
  
  
  connection.destroy();
}

queryData();