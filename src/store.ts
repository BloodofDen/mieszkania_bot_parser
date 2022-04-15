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

  #advertisements = new Map<IUser['telegramId'], Set<IAdvertisement>>();

  #timers = new Map<IUser['telegramId'], NodeJS.Timer>();

  constructor(callback: StoreCallback) {
    this.#callback = callback;
  }

  async setup(users: IUser[]): Promise<void> {
    this.users = new Map(
      users.map(
        user => [user.telegramId, user],
      ),
    );
    this.#parsers = new Map(
      users.map(
        user => [user.telegramId, new Parser(user.criteria)],
      ),
    );

    const advertisements = await Promise.all(
      users.map(
        user => this.#parsers.get(user.telegramId)!.parse(),
      ),
    );

    this.#advertisements = new Map(
      users.map(
        (user, i) => [user.telegramId, new Set(advertisements[i])],
      ),
    )

    this.#timers = new Map(
      users.map(
        user => [
          user.telegramId, setInterval(
            this.#callback,
            this.#parsingFrequency,
            user.telegramId,
            this.#parsers.get(user.telegramId)!,
            this.#advertisements.get(user.telegramId)!,
          ),
        ],
      ),
    );

    console.log(`Store was successfully set up`);
  }

  async add(user: IUser): Promise<void> {
    const shouldUpdateUser = this.users.has(user.telegramId);

    this.users.set(user.telegramId, user);

    const parser = new Parser(user.criteria);
    this.#parsers.set(user.telegramId, parser);

    const advertisements = await parser.parse();
    this.#advertisements.set(user.telegramId, new Set(advertisements));

    if (shouldUpdateUser) {
      console.log(`User with id = '${user.telegramId}' was updated`);
      return;
    }

    this.#timers.set(user.telegramId, setInterval(
      this.#callback,
      this.#parsingFrequency,
      user.telegramId,
      this.#parsers.get(user.telegramId)!,
      this.#advertisements.get(user.telegramId)!,
    ));

    console.log(`User with id = '${user.telegramId}' was added`);
  }

  remove(telegramId: IUser['telegramId']): void {
    const intervalId = this.#timers.get(telegramId);
    clearInterval(intervalId!);

    this.users.delete(telegramId);
    this.#parsers.delete(telegramId);
    this.#advertisements.delete(telegramId);
    this.#timers.delete(telegramId);

    console.log(`User with id = '${telegramId}' was removed`);
  }
}
