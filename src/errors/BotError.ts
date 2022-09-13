import { TelegramError } from 'telegraf';
import type { IUser } from '../models';

export class BotError extends Error {
  constructor(
    public telegramError: TelegramError,
    public userId: IUser['telegramId']
  ) {
    super();
  }
}
