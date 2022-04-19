import { isEqual } from 'lodash';
import type { Message, CallbackQuery } from 'typegram';
import { Scenes } from 'telegraf';
import { Controller } from '../controllers';
import type { IState } from '../models';
import { Scene, BlitzResponse } from './models';
import { mapTelegramUserToUser } from './mappers';
import { createInitialScene } from './initial.scene';
import { createProvinceScene } from './province.scene';
import { createCityScene } from './city.scene';
import { createRoomsNumberScene } from './roomsNumber.scene';
import { createAreaScene } from './area.scene';
import { createPriceScene } from './price.scene';
import { createPrivateScene } from './private.scene';

const controller = new Controller();

export const scenes: Scenes.WizardScene<Scenes.WizardContext>[] = [
  createInitialScene(async (ctx) => {
    const state = ctx.wizard.state as IState;
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataCallbackQuery;
    const inlineResponse = callbackQuery.data as BlitzResponse;
    const message = ctx.message as Message.LocationMessage;

    if (inlineResponse === BlitzResponse.Yes) {
      return Scene.Province;
    }

    return Scene.RoomsNumber;
  }),
  createProvinceScene((ctx) => {
    const { criteria } = ctx.wizard.state as IState;

    return criteria.province ? Scene.City : Scene.RoomsNumber;
  }),
  createCityScene(() => Scene.RoomsNumber),
  createRoomsNumberScene(() => Scene.Area),
  createAreaScene(() => Scene.Price),
  createPriceScene(() => Scene.Private),
  createPrivateScene(async (ctx) => {
    const { user: telegramUser, criteria, store } = ctx.wizard.state as IState;
    const user = mapTelegramUserToUser(telegramUser, criteria);
    const userInStore = store.users.get(user.telegramId);

    if (isEqual(user, userInStore)) {
      await ctx.reply(`Complete same settings were provided!`);

      return;
    }

    await controller.user.upsertUser(user);
    await store.add(user);

    await ctx.reply(`Your settings have been saved! Please wait when new ads come up.`);
  }),
];
