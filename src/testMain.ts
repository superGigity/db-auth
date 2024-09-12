import { DbAuth } from "./main";

const sqlAuth = new DbAuth();

sqlAuth.setCondition('user',['user.age > 18','user.sex = 1']);

console.log(sqlAuth.getExecSql(`select * from \`user\` as user_tables;`,['user'])); 