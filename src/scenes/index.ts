import { Scenes } from 'telegraf';
import { Scene, IState } from '../models';
import { userController } from '../controllers';
import { createProvinceScene } from './province.scene';
import { createCityScene } from './city.scene';
import { createRoomsNumberScene } from './roomsNumber.scene';
import { createAreaScene } from './area.scene';
import { createPriceScene } from './price.scene';
import { createPrivateScene } from './private.scene';

export const scenes: Scenes.WizardScene<Scenes.WizardContext>[] = [
  createProvinceScene((ctx) => {
    const { criteria } = ctx.wizard.state as IState;

    return criteria.province ? Scene.City : Scene.RoomsNumber;
  }),
  createCityScene(() => Scene.RoomsNumber),
  createRoomsNumberScene(() => Scene.Area),
  createAreaScene(() => Scene.Price),
  createPriceScene(() => Scene.Private),
  createPrivateScene(async (ctx) => {
    const { user, criteria, store } = ctx.wizard.state as IState;
    const upsertedUser = await userController.upsertUser(user, criteria);

    if (upsertedUser) {
      await store.add(upsertedUser);
    }

    await ctx.reply(`From: 'createPrivateScene'. Thanks! Bye!`);
  }),
];
