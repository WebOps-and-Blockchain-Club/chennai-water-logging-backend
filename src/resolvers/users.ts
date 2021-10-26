import { Query, Resolver } from "type-graphql";

@Resolver()
export class HelloWorldResolver {
  @Query(() => String)
  helloworld() {
    return "Hello World";
  }
}
