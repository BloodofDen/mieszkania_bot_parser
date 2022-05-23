import isEqual from 'lodash.isequal';
import differenceWith from 'lodash.differencewith';
import { Telegraf, Scenes, TelegramError } from 'telegraf';
import type { IUser, IAdvertisement, StoreCallback } from './models';
import { Parser } from './parsers';
import { Store } from './store';
import { BlockedByUserError } from './errors';

export const stopBot = (
  bot: Telegraf<Scenes.WizardContext>,
  store: Store,
  reason: string,
) => () => {
  store.users.forEach((_value, key) => store.remove(key));
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
  } catch (err) {
    throw new BlockedByUserError(
      err as TelegramError,
      userTelegramId,
    );
  }
};
