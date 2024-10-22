import { DeleteTokenEnum } from "./delete";
import { InsertTokenEnum } from "./insert";
import { QueryTokenEnum } from "./query";
import { TableExecTokenEnum } from "./table";
import { UpdateTokenEnum } from "./update";

export const TokenEnum = {
    ...QueryTokenEnum,
    ...InsertTokenEnum,
    ...TableExecTokenEnum,
    ...UpdateTokenEnum,
    ...DeleteTokenEnum,
}
export type TokenEnumType = keyof typeof TokenEnum;