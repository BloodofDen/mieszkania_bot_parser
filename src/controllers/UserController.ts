import { IUser, User } from '../models';

export class UserController {
  async upsertUser(user: IUser): Promise<void> {
    try {
      await User.findOneAndUpdate(
        { telegramId: user.telegramId },
        user,
        { upsert: true },
      );
    } catch (e) {
      console.error('Error while upsertUser:::', e);
    }
  }

  async getUsers(): Promise<IUser[]> {
    let users: IUser[] = [];

    try {
      users = await User.find({}).lean();
    } catch (e) {
      console.error('Error while getUsers:::', e);
    }

    return users;
  }

  async deleteUser(telegramId: IUser['telegramId']): Promise<void> {
    try {
      await User.deleteOne({ telegramId });
    } catch (e) {
      console.error('Error while deleteUser:::', e);
    }
  }
}
