import { RequiredEntityData } from '@mikro-orm/core';
import { Users } from '../entities/Users';
import { MyContext } from 'src/types';
import { Arg, Ctx, Field, Mutation, ObjectType, Resolver } from 'type-graphql';
import argon2 from 'argon2';

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResopnse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Users, { nullable: true })
  user?: Users;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResopnse)
  async register(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() { em }: MyContext,
  ) {
    if (username.length <= 2) {
      return {
        errors: [
          {
            field: 'username',
            message: 'length must be greater than 2',
          },
        ],
      };
    }
    if (password.length <= 2) {
      return {
        errors: [
          {
            field: 'password',
            message: 'length must be greater than 2',
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(password);
    const user = em.create(Users, {
      username: username,
      password: hashedPassword,
    } as RequiredEntityData<Users>);
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === '23505') {
        //|| err.detail.includes('already exists')) {
        // dupilcate username error
      }
      return {
        errors: [
          {
            field: 'username',
            message: 'username already taken',
          },
        ],
      };
    }
    return { user };
  }

  @Mutation(() => UserResopnse)
  async login(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() { em }: MyContext,
  ): Promise<UserResopnse> {
    const user = await em.findOne(Users, { username: username });
    if (!user) {
      return {
        errors: [{ field: 'username', message: "that username doesn't exist" }],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    return {
      user,
    };
  }
}
