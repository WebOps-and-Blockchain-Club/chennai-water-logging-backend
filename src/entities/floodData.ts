import cuid from "cuid";
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  PrimaryColumn,
} from "typeorm";

@Entity("FloodData")
@ObjectType("FloodData")
export class FloodData extends BaseEntity {
  @BeforeInsert()
  async setId() {
    this.id = cuid();
  }

  @PrimaryColumn()
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  location: string;

  @Column()
  @Field()
  depth: string;

  @Column()
  @Field()
  image: string;
}
