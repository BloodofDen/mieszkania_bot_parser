import isEqual from 'lodash.isequal';
import { IUser, IAdvertisement, StoreCallback, UserState } from './models';
import { Parser } from './parsers';
import { BotError } from './errors';

const {
  DEFAULT_PARSING_FREQUENCY = 0.5,
} = process.env;

export class Store {
  readonly #parsingFrequency = Number(DEFAULT_PARSING_FREQUENCY) * 60000;

  readonly #callback: StoreCallback;

  readonly #users = new Map<IUser['telegramId'], IUser>();

  readonly #parsers = new Map<IUser['telegramId'], Parser>();

  readonly #advertisements = new Map<IUser['telegramId'], IAdvertisement[]>();

  readonly #timers = new Map<IUser['telegramId'], NodeJS.Timer>();

  constructor(callback: StoreCallback) {
    this.#callback = (...params) => callback(...params).catch(this.handleError);
  }

  async setup(users: IUser[]): Promise<void> {
    await Promise.all(users.map(user => this.add(user)));

    console.log('store.setup:', `Store successfully set up`);
  }

  async add(user: IUser): Promise<void> {
    this.#users.set(user.telegramId, user);

    if (user.currentState !== UserState.Paused) {
      await this.setUpUser(user.telegramId, user.criteria);
    }

    console.log('store.add:', `User with id = '${user.telegramId}' is added`);
  }

  async update(
    telegramId: IUser['telegramId'],
    dataToUpdate: Partial<Omit<IUser, 'telegramId'>>,
  ): Promise<void> {
    const user = this.get(telegramId);

    if (!user) {
      throw new Error(`User with id = '${telegramId}' not in the store so it can't be updated`);
    }

    this.#users.set(telegramId, { ...user, ...dataToUpdate });

    if (
      dataToUpdate.criteria &&
      !isEqual(user.criteria, dataToUpdate.criteria)
    ) {
      await this.setUpUser(telegramId, dataToUpdate.criteria);
    }

    if (
      dataToUpdate.currentState === UserState.Paused &&
      user.currentState !== dataToUpdate.currentState
    ) {
      this.unSetUpUser(telegramId);
    }

    if (
      dataToUpdate.currentState === UserState.Active &&
      user.currentState !== dataToUpdate.currentState
    ) {
      await this.setUpUser(telegramId, user.criteria);
    }

    console.log('store.update:', `User with id = '${telegramId}' is updated`);
  }

  get(telegramId: IUser['telegramId']): IUser | void {
    return this.#users.get(telegramId);
  }

  has(telegramId: IUser['telegramId']): boolean {
    return this.#users.has(telegramId);
  }

  remove(telegramId: IUser['telegramId']): void {
    this.unSetUpUser(telegramId);
    this.#users.delete(telegramId);

    console.log('store.remove:', `User with id = '${telegramId}' is removed`);
  }

  removeAll(): void {
    this.#users.forEach((_user, telegramId) => this.remove(telegramId));

    console.log('store.removeAll:', `All users were removed`);
  }

  private async setUpUser(
    telegramId: IUser['telegramId'],
    criteria: IUser['criteria'],
  ): Promise<void> {
    const parser = new Parser(criteria);
    this.#parsers.set(telegramId, parser);

    const advertisements = await parser.parse();
    this.#advertisements.set(telegramId, advertisements);

    this.setTimer(telegramId, parser, advertisements);

    console.log('store.setUpUser:', `User with id = '${telegramId}' is setup`);
  }

  private unSetUpUser(telegramId: IUser['telegramId']): void {
    this.removeTimer(telegramId);

    this.#advertisements.delete(telegramId);
    this.#parsers.delete(telegramId);

    console.log('store.unSetUpUser:', `User with id = '${telegramId}' is unsetup`);
  }

  private removeTimer(telegramId: IUser['telegramId']): void {
    const intervalId = this.#timers.get(telegramId);

    if (!intervalId) {
      console.log('store.removeTimer:', `No timer set up for user with id = '${telegramId}'`);

      return;
    }

    clearInterval(intervalId);
    this.#timers.delete(telegramId);

    console.log('store.removeTimer:', `Timer is removed for user with id = '${telegramId}'`);
  }

  private setTimer(
    telegramId: IUser['telegramId'],
    parser?: Parser,
    advertisements?: IAdvertisement[],
  ): void {
    const intervalId = setInterval(
      this.#callback,
      this.#parsingFrequency,
      telegramId,
      parser ?? this.#parsers.get(telegramId)!,
      advertisements ?? this.#advertisements.get(telegramId)!,
    );

    this.#timers.set(telegramId, intervalId);

    console.log('store.setTimer:', `Timer is set for user with id = '${telegramId}'`);
  }

  private handleError = (e: BotError): void => {
    console.log('store.handleError:', `Error: ${JSON.stringify(e, null, 4)}`);

    if (e.telegramId) {
      this.remove(e.telegramId);
    }
  }
}
