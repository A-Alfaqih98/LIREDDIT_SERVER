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
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME } from '../constants';
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
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('emial') email: string, @Ctx() { em }: MyContext) {
    const user = await em.findOne(Users, { email });
    if (!user) {
      // this email is not in the db
      return true;
    }
    const token = '987fsdfsd';
    await sendEmail(
      email,
      `<a href="http://localhost3000/change-password/${token}">reset passord</a>`,
    );

    return true;
  }

  @Query(() => Users, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    console.log(req.session);
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
