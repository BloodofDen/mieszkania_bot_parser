import type { IUser, IAdvertisement, StoreCallback } from './models';
import { Parser } from './parsers';
import { BlockedByUserError, ERROR_TYPE } from './errors';

const {
  DEFAULT_PARSING_FREQUENCY = 0.5,
} = process.env;

export class Store {
  readonly #parsingFrequency = Number(DEFAULT_PARSING_FREQUENCY) * 60000;

  readonly #callback: StoreCallback;

  users = new Map<IUser['telegramId'], IUser>();

  #parsers = new Map<IUser['telegramId'], Parser>();

  #advertisements = new Map<IUser['telegramId'], IAdvertisement[]>();

  #timers = new Map<IUser['telegramId'], NodeJS.Timer>();

  constructor(callback: StoreCallback) {
    this.#callback = (...params) => callback(...params).catch(this.handleError);
  }

  async setup(users: IUser[]): Promise<void> {
    await Promise.all(users.map(user => this.add(user)));

    console.log(`Store successfully set up`);
  }

  async add(user: IUser): Promise<void> {
    const isUserAlreadyInStore = this.users.has(user.telegramId);

    this.users.set(user.telegramId, user);

    const parser = new Parser(user.criteria);
    this.#parsers.set(user.telegramId, parser);

    const advertisements = await parser.parse();
    this.#advertisements.set(user.telegramId, advertisements);

    this.setTimer(user.telegramId, parser, advertisements);

    console.log(`User with id = '${user.telegramId}' was ${isUserAlreadyInStore ? 'updated' : 'added'}`);
  }

  has(telegramId: IUser['telegramId']): boolean {
    return this.users.has(telegramId);
  }

  remove(telegramId: IUser['telegramId']): void {
    this.removeTimer(telegramId);

    this.users.delete(telegramId);
    this.#parsers.delete(telegramId);
    this.#advertisements.delete(telegramId);

    console.log(`User with id = '${telegramId}' was removed`);
  }

  removeTimer(telegramId: IUser['telegramId']): void {
    const intervalId = this.#timers.get(telegramId);

    if (!intervalId) {
      console.log(`No timer set up for user with id = '${telegramId}'`);

      return;
    }

    clearInterval(intervalId);
    this.#timers.delete(telegramId);

    console.log(`Timer was removed for user with id = '${telegramId}'`);
  }

  setTimer(
    telegramId: IUser['telegramId'],
    parser?: Parser,
    advertisements?: IAdvertisement[],
  ): void {
    this.#timers.set(telegramId, setInterval(
      this.#callback,
      this.#parsingFrequency,
      telegramId,
      parser ?? this.#parsers.get(telegramId)!,
      advertisements ?? this.#advertisements.get(telegramId)!,
    ));

    console.log(`Timer was set for user with id = '${telegramId}'`);
  }

  private handleError = (err: Error): void => {
    if (err instanceof BlockedByUserError) {
      if (err.telegramError.response.error_code === ERROR_TYPE.BLOCKED_BY_USER) {
        console.error(`Bot was blocked by the user with id = '${err.userId}'`);
      }

      this.removeTimer(err.userId);
    }
  }
}
