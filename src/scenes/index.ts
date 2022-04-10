import { Scenes } from 'telegraf';
import { Scene, IWizardState } from '../models';
import { upsertUser } from '../controllers/user.controller';
import { createProvinceScene } from './province.scene';
import { createCityScene } from './city.scene';
import { createRoomsNumberScene } from './roomsNumber.scene';
import { createAreaScene } from './area.scene';
import { createPriceScene } from './price.scene';
import { createPrivateScene } from './private.scene';

export const scenes: Scenes.WizardScene<Scenes.WizardContext>[] = [
  createProvinceScene((ctx) => {
    const { criteria } = ctx.wizard.state as IWizardState;

    return criteria.province ? Scene.City : Scene.RoomsNumber;
  }),
  createCityScene(() => Scene.RoomsNumber),
  createRoomsNumberScene(() => Scene.Area),
  createAreaScene(() => Scene.Price),
  createPriceScene(() => Scene.Private),
  createPrivateScene(async (ctx) => {
    const isInserted = await upsertUser(ctx.wizard.state as IWizardState);

    if (isInserted) {
      console.log('Timeout set!');
    }

    await ctx.reply(`From: 'createPrivateScene'. Thanks! Bye!`);
  }),
];
