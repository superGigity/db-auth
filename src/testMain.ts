const parser = require('js-sql-parser');
const ast = parser.parse('select table.a as aa,table.b from table');
console.log(ast);