import { TelegramError } from 'telegraf';
import { IUser } from '../models';

export class BlockedByUserError extends Error {
  constructor(
    public telegramError: TelegramError,
    public userId: IUser['telegramId']
  ) {
    super();
  }
}
