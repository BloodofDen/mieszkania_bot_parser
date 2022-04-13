import { Query } from 'mongoose';
import type { User as ITelegramUser } from 'typegram';
import { IUserDocument, User } from '../models';
import type { IUser, ICriteria } from '../models';

export const upsertUser = (
  user: ITelegramUser,
  criteria: ICriteria,
): Query<IUserDocument, IUserDocument> | void => {
  const newUser: IUser = {
    telegramId: user.id,
    isBot: user.is_bot,
    firstName: user.first_name,
    lastName: user.last_name,
    nickname: user.username,
    languageCode: user.language_code,
    criteria,
  };

  try {
    // const {
    //   lastErrorObject: {
    //     updatedExisting,
    //     upserted,
    //   } = {},
    // } = await
    return User.findOneAndUpdate(
      { telegramId: newUser.telegramId },
      newUser,
      {
        new: true,
        // rawResult: true,
        upsert: true,
      },
    );

    // return !updatedExisting && Boolean(upserted);
  } catch (err) {
    console.error('Error while saving upserting user:::', err);
    return;
  }
}

export const getUsers = (): Query<IUserDocument[], IUserDocument> | never[] => {
  try {
    return User.find({});
  } catch (err) {
    console.error('Error while saving upserting user:::', err);
    return [];
  }
}
