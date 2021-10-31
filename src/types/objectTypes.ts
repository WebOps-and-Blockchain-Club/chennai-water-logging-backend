import { FloodData } from "../entities/floodData";
import { Field, ObjectType } from "type-graphql";

@ObjectType("GetFloodDatasOutput")
class GetFloodDatasOutput {
  @Field(() => [FloodData])
  datas: FloodData[];

  @Field(() => Number)
  count: Number;
}

export { GetFloodDatasOutput };
