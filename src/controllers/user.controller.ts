import { User } from '../models';
import type { IUser, IWizardState } from '../models';

export const upsertUser = async (
  { user, criteria }: IWizardState,
): Promise<boolean> => {
  const newUser: IUser = {
    telegramId: user.id,
    isBot: user.is_bot,
    firstName: user.first_name,
    lastName: user.last_name,
    nickname: user.username,
    languageCode: user.language_code,
    criteria,
    isActive: true,
  };

  try {
    const {
      lastErrorObject: {
        updatedExisting,
        upserted,
      } = {},
    } = await User.findOneAndUpdate(
      { telegramId: newUser.telegramId },
      newUser,
      {
        new: true,
        rawResult: true,
        upsert: true,
      },
    );

    return !updatedExisting && upserted;
  } catch (err) {
    console.error('Error while saving upserting user:::', err);
    return false;
  }
}
