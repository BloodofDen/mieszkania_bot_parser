import { Telegraf, Scenes } from 'telegraf';
import { IUser, IAdvertisement } from './models';
import { Parser } from './parsers';

const {
  DEFAULT_PARSING_FREQUENCY = 0.5,
} = process.env;

export class Store {
  readonly #parsingFrequency = Number(DEFAULT_PARSING_FREQUENCY) * 60000;

  readonly #bot: Telegraf<Scenes.WizardContext>;

  #users = new Map<IUser['telegramId'], IUser>();

  #timers = new Map<IUser['telegramId'], NodeJS.Timer>();

  #parsers = new Map<IUser['telegramId'], Parser>();

  #advertisements = new Map<IUser['telegramId'], Set<IAdvertisement>>();

  constructor(bot: Telegraf<Scenes.WizardContext>) {
    this.#bot = bot;
  }

  async setup(users: IUser[]): Promise<void> {
    this.#users = new Map(
      users.map(user => [user.telegramId, user]),
    );
    this.#timers = new Map(
      users.map(user => [
        user.telegramId,
        setInterval(this.callback.bind(this), this.#parsingFrequency, user),
      ]),
    );
    this.#parsers = new Map(
      users.map(user => [user.telegramId, new Parser(user.criteria)]),
    );

    const advertisements = await Promise.all(
      users.map(
        user => this.#parsers.get(user.telegramId)!.parse(),
      ),
    );

    this.#advertisements = new Map(
      users.map(
        (user, i) => [
          user.telegramId,
          new Set(advertisements[i]),
        ],
      ),
    )
  }

  add(user: IUser): void {
    this.#users.set(user.telegramId, user);
    this.#timers.set(
      user.telegramId,
      setInterval(this.callback.bind(this), this.#parsingFrequency, user),
    );
  }

  remove(telegramId: IUser['telegramId']): void {
    const intervalId = this.#timers.get(telegramId);
    clearInterval(intervalId!);

    this.#users.delete(telegramId);
    this.#timers.delete(telegramId);
  }

  private async callback(
    user: IUser,
  ): Promise<void> {
    // const advertisements = await this.#parsers.get(user.telegramId)!.parse();
    // const diff = _.differenceWith(links, fileData.split('\n'), _.isEqual);
    // await this.#bot.telegram.sendMessage(user.telegramId, message);
  };
}
