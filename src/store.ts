import type { IUser, IAdvertisement, StoreCallback } from './models';
import { Parser } from './parsers';

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
    this.#callback = callback;
  }

  async setup(users: IUser[]): Promise<void> {
    await Promise.all(users.map(user => this.add(user)));

    console.log(`Store successfully set up`);
  }

  async add(user: IUser): Promise<void> {
    this.users.set(user.telegramId, user);

    const parser = new Parser(user.criteria);
    this.#parsers.set(user.telegramId, parser);

    const advertisements = await parser.parse();
    this.#advertisements.set(user.telegramId, advertisements);

    this.setTimer(user.telegramId, parser, advertisements);

    console.log(`User with id = '${user.telegramId}' was added`);
  }

  async update(user: IUser): Promise<void> {
    this.removeTimer(user.telegramId);

    this.users.set(user.telegramId, user);

    const parser = new Parser(user.criteria);
    this.#parsers.set(user.telegramId, parser);

    const advertisements = await parser.parse();
    this.#advertisements.set(user.telegramId, advertisements);

    this.setTimer(user.telegramId, parser, advertisements);

    console.log(`User with id = '${user.telegramId}' was updated`);
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
    clearInterval(intervalId!);
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
}
