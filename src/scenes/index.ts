import { Scenes } from 'telegraf';
import { controller } from '../controllers';
import { BotCommand } from '../commands';
import type { IState } from '../models';
import { Scene } from './models';
import { mapTelegramUserToUser } from './utils';
import { createProvinceScene } from './province.scene';
import { createCityScene } from './city.scene';
import { createRoomsNumberScene } from './roomsNumber.scene';
import { createAreaScene } from './area.scene';
import { createPriceScene } from './price.scene';
import { createPrivateScene } from './private.scene';

const TEXT = {
  COMMON: `New ads will come up soon!\n
/${BotCommand.Print} - to print current settings criteria
/${BotCommand.Help} - to see all available commands`,
  SETTINGS: {
    [BotCommand.Start]: `Your settings have been saved!`,
    [BotCommand.Update]: `Your settings have been updated!`,
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

    await controller.user.upsertUser(user);
    await store.add(user);

    await ctx.reply(TEXT.SETTINGS[command] + TEXT.COMMON);
  }),
];
