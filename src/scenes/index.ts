import { isEqual } from 'lodash';
import { Scenes } from 'telegraf';
import { controller } from '../controllers';
import { BotCommand } from '../commands';
import type { IState } from '../models';
import { Scene } from './models';
import { mapTelegramUserToUser } from './mappers';
import { createProvinceScene } from './province.scene';
import { createCityScene } from './city.scene';
import { createRoomsNumberScene } from './roomsNumber.scene';
import { createAreaScene } from './area.scene';
import { createPriceScene } from './price.scene';
import { createPrivateScene } from './private.scene';

const TEXT = {
  COMMON: `/${BotCommand.Print} - to print current settings criteria
/${BotCommand.Help} - to see all available commands`,
  SETTINGS_SAME: `Complete same settings were provided!`,
  SETTINGS_SAVED: {
    [BotCommand.Start]: `Your settings have been saved! New ads will come up soon!`,
    [BotCommand.Update]: `Your settings have been updated! New ads will come up soon!`,
  },
};

export const scenes: Scenes.WizardScene<Scenes.WizardContext>[] = [
  createProvinceScene((ctx) => {
    const { criteria } = ctx.wizard.state as IState;
    const shouldGoToCityScene = criteria.province && !criteria.city;

    return shouldGoToCityScene ? Scene.City : Scene.RoomsNumber;
  }),
  createCityScene(() => Scene.RoomsNumber),
  createRoomsNumberScene(() => Scene.Area),
  createAreaScene(() => Scene.Price),
  createPriceScene(() => Scene.Private),
  createPrivateScene(async (ctx) => {
    const { user: telegramUser, criteria, store, command } = ctx.wizard.state as IState;
    const user = mapTelegramUserToUser(telegramUser, criteria);
    const userInStore = store.get(user.telegramId);

    if (isEqual(user, userInStore)) {
      store.setTimer(user.telegramId);
      await ctx.reply(`${TEXT.SETTINGS_SAME}\n${TEXT.COMMON}`);

      return;
    }

    await controller.user.upsertUser(user);

    if (!userInStore) {
      await store.add(user);
    } else {
      await store.update(user);
    }

    await ctx.reply(`${TEXT.SETTINGS_SAVED[command]}\n${TEXT.COMMON}`);
  }),
];
