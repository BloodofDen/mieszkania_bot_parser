import { IUser, User } from '../models';

export class UserController {
  async upsertUser(user: IUser): Promise<void> {
    try {
      await User.findOneAndUpdate(
        { telegramId: user.telegramId },
        user,
        { upsert: true },
      );
    } catch (err) {
      console.error('Error while upsertUser:::', err);
    }
  }

  async getUsers(): Promise<IUser[]> {
    let users: IUser[] = [];

    try {
      users = await User.find({}).lean();
    } catch (err) {
      console.error('Error while getUsers:::', err);
    }

    return users;
  }

  async deleteUser(telegramId: IUser['telegramId']): Promise<void> {
    try {
      await User.deleteOne({ telegramId });
    } catch (err) {
      console.error('Error while deleteUser:::', err);
    }
  }
}
