import { Query } from 'mongoose';
import { IUserDocument, User } from '../models';
import type { IUser } from '../models';

export const upsertUser = (
  user: IUser,
): void => {
  try {
    User.findOneAndUpdate(
      { telegramId: user.telegramId },
      user,
      { upsert: true },
    );
  } catch (err) {
    console.error('Error while upsertUser:::', err);
  }
}

export const getUsers = (): Query<IUserDocument[], IUserDocument> | never[] => {
  try {
    return User.find({});
  } catch (err) {
    console.error('Error while getUsers:::', err);
    return [];
  }
}
