import { parse } from "./sql-parse/terms-parse";

parse('select (select username from user) from (select * from user) cuser where id = 1');
