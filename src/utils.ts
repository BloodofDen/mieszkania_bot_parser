import { isEqual, differenceWith } from 'lodash';
import { Telegraf, Scenes } from 'telegraf';
import type { IUser, IAdvertisement, StoreCallback } from './models';
import { Parser } from './parsers';
import { Store } from './store';

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

  advertisements.unshift(...diffAds);

  const sendMessagePromises = diffAds.map(
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

      return bot.telegram.sendMessage(
        userTelegramId,
        message,
        { parse_mode: 'HTML' },
      );
    },
  );

  await Promise.all(sendMessagePromises);
};
