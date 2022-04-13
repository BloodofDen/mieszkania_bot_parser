import { isEqual, differenceWith } from 'lodash';
import { Telegraf, Scenes, Markup } from 'telegraf';
import { IUser, IAdvertisement } from './models';
import { Parser } from './parsers';

const {
  DEFAULT_PARSING_FREQUENCY = 0.5,
} = process.env;

export class Store {
  readonly #parsingFrequency = Number(DEFAULT_PARSING_FREQUENCY) * 60000;

  readonly #bot: Telegraf<Scenes.WizardContext>;

  users = new Map<IUser['telegramId'], IUser>();

  #parsers = new Map<IUser['telegramId'], Parser>();

  #advertisements = new Map<IUser['telegramId'], Set<IAdvertisement>>();

  #timers = new Map<IUser['telegramId'], NodeJS.Timer>();

  constructor(bot: Telegraf<Scenes.WizardContext>) {
    this.#bot = bot;
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
            this.callback.bind(this),
            this.#parsingFrequency,
            user,
          ),
        ],
      ),
    );

    console.log(`Store was successfully set up`);
  }

  async add(user: IUser): Promise<void> {
    this.users.set(user.telegramId, user);

    const parser = new Parser(user.criteria);
    this.#parsers.set(user.telegramId, parser);

    const advertisements = await parser.parse();
    this.#advertisements.set(user.telegramId, new Set(advertisements));

    if (!this.users.has(user.telegramId)) {
      this.#timers.set(user.telegramId, setInterval(
        this.callback.bind(this),
        this.#parsingFrequency,
        user,
      ));

      console.log(`User with id = '${user.telegramId}' was added`);
      return;
    }

    console.log(`User with id = '${user.telegramId}' was updated`);
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

  private async callback(user: IUser): Promise<void> {
    const advertisements = await this.#parsers.get(user.telegramId)!.parse();
    const advertisementsInStore = this.#advertisements.get(user.telegramId);
    const diffs = differenceWith(advertisements, Array.from(advertisementsInStore!), isEqual);

    if (!diffs.length) {
      console.log(`Diffs weren't found`);
      return;
    }

    console.log(`Diffs found!`);

    const sendMessagePromises = diffs.map(
      diff => {
        const sentences = [
          `<b>${diff.title}</b>`,
          `Address: <b>${diff.address}</b>`,
          diff.area ? `Area: <b>${diff.area}</b>` : '',
          `Price: <b>${diff.price}</b>`,
        ];
        const message = sentences.filter(Boolean).join('\n');

        return this.#bot.telegram.sendMessage(
          user.telegramId,
          message,
          {
            parse_mode: 'HTML',
            // reply_markup:
            ...Markup.inlineKeyboard([
              Markup.button.url(`Link to ${diff.source}`, diff.link),
            ]),
          },
        );
      },
    );

    await Promise.all(sendMessagePromises);
  };
}
