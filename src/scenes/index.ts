import { isEqual } from 'lodash';
import { Scenes } from 'telegraf';
import { Controller } from '../controllers';
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

const controller = new Controller();

const TEXT = {
  SETTINGS_SAME: `Complete same settings were provided!\n
/${BotCommand.Print} - to print current settings criteria
/${BotCommand.Help} - to see all available commands`,
  SETTINGS_SAVED: `Your settings have been saved! New ads will come up soon!\n
/${BotCommand.Print} - to print current settings criteria
/${BotCommand.Help} - to see all available commands`,
};

export const scenes: Scenes.WizardScene<Scenes.WizardContext>[] = [
  createProvinceScene((ctx) => {
    const { criteria } = ctx.wizard.state as IState;
    const shouldGoToCityScene = criteria.province && !criteria.province;

    return shouldGoToCityScene ? Scene.City : Scene.RoomsNumber;
  }),
  createCityScene(() => Scene.RoomsNumber),
  createRoomsNumberScene(() => Scene.Area),
  createAreaScene(() => Scene.Price),
  createPriceScene(() => Scene.Private),
  createPrivateScene(async (ctx) => {
    const { user: telegramUser, criteria, store } = ctx.wizard.state as IState;
    const user = mapTelegramUserToUser(telegramUser, criteria);
    const userInStore = store.get(user.telegramId);

    if (isEqual(user, userInStore)) {
      await ctx.reply(TEXT.SETTINGS_SAME);

      return;
    }

    console.log('userInStore:::', userInStore);
    console.log('user:::', user);

    await controller.user.upsertUser(user);

    if (!userInStore) {
      await store.add(user);
    } else {
      await store.update(user);
    }

    await ctx.reply(TEXT.SETTINGS_SAVED);
  }),
];
