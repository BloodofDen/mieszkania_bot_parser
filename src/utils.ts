import isEqual from 'lodash.isequal';
import differenceWith from 'lodash.differencewith';
import { Telegraf, Scenes, TelegramError } from 'telegraf';
import { IUser, IAdvertisement, StoreCallback, UserState } from './models';
import { controller } from './controllers';
import { Parser } from './parsers';
import { Store } from './store';
import { BotError, ERROR_TYPE } from './errors';

export const validateEnvVars = () => {
  const {
    MONGODB_LOGIN,
    MONGODB_PASSWORD,
    MONGODB_HOST,
    NODE_ENV,
    BOT_TOKEN,
    PORT,
    DOMAIN,
  } = process.env;

  if (!MONGODB_LOGIN || !MONGODB_PASSWORD || !MONGODB_HOST) {
    throw Error('MONGODB_LOGIN / MONGODB_PASSWORD / MONGODB_HOST variables unset');
  }

  if (!BOT_TOKEN) {
    throw Error('BOT_TOKEN variable unset');
  }

  if (NODE_ENV === 'production' && (!PORT || !DOMAIN)) {
    throw Error('PORT / DOMAIN variables unset');
  }
}

export const stopBot = (
  bot: Telegraf<Scenes.WizardContext>,
  store: Store,
  reason: string,
) => () => {
  store.removeAll();
  bot.stop(reason);
};

export const createStoreCallback = (
  bot: Telegraf<Scenes.WizardContext>,
): StoreCallback => async (
  userTelegramId: IUser['telegramId'],
  parser: Parser,
  advertisements: IAdvertisement[],
): Promise<void> => {
  const parsedAdvertisements = await parser.parse();
  const diffAds = differenceWith(parsedAdvertisements, advertisements, isEqual);

  if (!diffAds.length) {
    return;
  }

  advertisements.splice(advertisements.length - diffAds.length, diffAds.length);
  advertisements.unshift(...diffAds);

  const text = diffAds.map(
    (ad, i) => {
      const sentences = [
        i === 0 ? '🔥There are new ads. Check them out!🔥\n' : null,
        `📝Title: <b>${ad.title}</b>`,
        `🏠Address: <b>${ad.address}</b>`,
        ad.area ? `📐Area: <b>${ad.area}</b>` : null,
        `💰Price: <b>${ad.price}</b>`,
        `🌍Go to ${ad.source}: <b>${ad.link}</b>`,
      ];
      const message = sentences.filter(Boolean).join('\n');

      return message;
    },
  ).join('\n\n');

  try {
    await bot.telegram.sendMessage(
      userTelegramId,
      text,
      { parse_mode: 'HTML' },
    );
  } catch (e) {
    const telegramError = e as TelegramError;

    if (telegramError.code === ERROR_TYPE.BLOCKED_BY_USER) {
      console.log('utils.storeCallback:', `Bot was blocked by the user with id = '${userTelegramId}'`);

      await controller.user.update(
        userTelegramId,
        { currentState: UserState.Stopped },
      );
    }

    throw new BotError(telegramError, userTelegramId);
  }
};
