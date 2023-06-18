import { Users } from '../entities/Users';
import { MyContext } from 'src/types';
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import argon2 from 'argon2';
import { v4 } from 'uuid';
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME, FORGET_PASSWORD_PEFIX } from '../constants';
import { validateRigester } from '../utils/validateRigester';
import { sendEmail } from '../utils/sendEmail';

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
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, em, req }: MyContext,
  ): Promise<UserResopnse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length must be greater than 2',
          },
        ],
      };
    }

    const userId = await redis.get(FORGET_PASSWORD_PEFIX + token);
    if (!userId) {
      return { errors: [{ field: 'token', message: 'token expired' }] };
    }
    const user = await em.findOne(Users, { id: parseInt(userId, 10) });

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no loger exist',
          },
        ],
      };
    }
    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);

    //log in user afer changing password
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { em, redis }: MyContext,
  ) {
    email = email.toLocaleLowerCase();
    const user = await em.findOne(Users, { email });
    if (!user) {
      // this email is not in the db
      return true;
    }
    const token = v4({});
    await redis.set(
      FORGET_PASSWORD_PEFIX + token,
      user.id,
      'EX',
      60 * 60 * 24 * 3,
    ); // 3 days

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset passord</a>`,
    );

    return true;
  }

  @Query(() => Users, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(Users, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResopnse)
  async register(
    @Arg('username') username: string,
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext,
  ): Promise<UserResopnse> {
    username = username.toLocaleLowerCase();
    email = email.toLocaleLowerCase();
    const hashedPassword = await argon2.hash(password);
    let user;
    try {
      const errors = validateRigester(username, email, password);
      if (errors) {
        return { errors };
      }
      const result = await (em as EntityManager)
        .createQueryBuilder(Users)
        .getKnexQuery()
        .insert({
          username,
          email: email,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      user = result[0];
    } catch (err) {
      if (err.code === '23505') {
        //|| err.detail.includes('already exists')) {
        // dupilcate username error
        return {
          errors: [
            {
              field: 'username',
              message: 'username already taken',
            },
          ],
        };
      }
    }

    // store user id session
    //this will set a cokkiew on the user
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResopnse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext,
  ): Promise<UserResopnse> {
    const user = await em.findOne(
      Users,
      usernameOrEmail.includes('@')
        ? { email: usernameOrEmail.toLocaleLowerCase() }
        : { username: usernameOrEmail.toLocaleLowerCase() },
    );
    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: "that username or email doesn't exist",
          },
        ],
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

    req.session.userId = user.id;

    console.log({ req: req.session });
    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext): Promise<Boolean> {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }
}
