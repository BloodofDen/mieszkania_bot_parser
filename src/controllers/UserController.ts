import { IUser, User, UserState } from '../models';

export class UserController {
  async insert(user: IUser): Promise<void> {
    try {
      await User.create(user);
    } catch (e) {
      console.error('UserController.insert:', 'Error while insert:::', e);
      throw e;
    }
  }

  async update(
    telegramId: IUser['telegramId'],
    dataToUpdate: Partial<Omit<IUser, 'telegramId'>>,
  ): Promise<IUser> {
    try {
      return User.findOneAndUpdate(
        { telegramId },
        dataToUpdate,
        { new: true },
      ).lean();
    } catch (e) {
      console.error('UserController.update:', 'Error while update:::', e);
      throw e;
    }
  }

  async getAll(): Promise<IUser[]> {
    try {
      return User.find({
        currentState: {
          $not: { $eq: UserState.Stopped },
        },
      }).lean();
    } catch (e) {
      console.error('UserController.getAll:', 'Error while getAll:::', e);
      throw e;
    }
  }
}
