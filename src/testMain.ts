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
class roleModal implements TableAuth{
    tableName: string = 'role';

    id: number | undefined;

    username:string | undefined;
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
  sqlAuth.setFieldAuth<roleModal>(new roleModal(),{
    'id': TFieldAuth.allow,
    'username': TFieldAuth.allow
  })
  sqlAuth.setFieldAuth<userModal>(new userModal(),{
      'id': TFieldAuth.allow,
      'age': TFieldAuth.allow,
      'username' : TFieldAuth.allow,
      'password' : TFieldAuth.allow,
      'sex' : TFieldAuth.readOnly
  });
  

  const authSql = await sqlAuth.getAuthSql('select user.username from user limit 10',['user']); 
  console.log(authSql);
  try{
    const [ row ] = await connection.query(authSql);
    console.log(sqlAuth.resultData(row as any,{
      'username':{ tableName:'role',handle:(data)=> data.replace(/.(?=.{2})/g, '*') }
    }));
  }catch(error){
    sqlAuth.resultError(error as MySQLError);
  }
  
  
  connection.destroy();
}

queryData();