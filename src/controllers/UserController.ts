import type { Query } from 'mongoose';
import { IUser, IUserDocument, User } from '../models';

export class UserController {
  upsertUser(user: IUser): Query<IUserDocument | null, IUserDocument> | void {
    try {
      return User.findOneAndUpdate(
        { telegramId: user.telegramId },
        user,
        { upsert: true },
      );
    } catch (err) {
      console.error('Error while upsertUser:::', err);
      return;
    }
  }

  getUsers(): Query<IUserDocument[], IUserDocument> | never[] {
    try {
      return User.find({}).lean();
    } catch (err) {
      console.error('Error while getUsers:::', err);
      return [];
    }
  }
}
