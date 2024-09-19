import { DbAuth } from "./main";
import { TFieldAuth } from "./type/auth";

const sqlAuth = new DbAuth(async ()=>true);

sqlAuth.setFieldAuth('user_role', 'age',TFieldAuth.show);
sqlAuth.setFieldAuth('user_role', 'sex',TFieldAuth.show);

sqlAuth.setCondition('user_role',['user_role.age > 18','user_role.sex = 1']);

sqlAuth.setFieldAuth('user', 'number',TFieldAuth.show);

(async function(){
    console.log(await sqlAuth.getExecSql(`select user_tables.age from \`user_role\` as user_tables left join user;`,['user_role','user'])); 
})();