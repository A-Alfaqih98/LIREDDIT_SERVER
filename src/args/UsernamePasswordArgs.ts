import { ArgsType, Field } from 'type-graphql';

@ArgsType()
export class UsernamePasswordInput {
  @Field(() => String)
  username: string;

  @Field(() => String)
  password: string;
}
