import axios from 'axios';
import type { Message, Location } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, Province, City } from './models';
import { wizardSceneFactory } from './utils';

const TEXT = {
  HOW_PROVIDE_DETAILS: `How would you like to provide Province/City details?`,
  PLEASE_SELECT: `Please select <b>${Scene.Province}</b>:`,
  PROVIDE_LOCATION: 'Provide location',
  PROVIDE_FROM_LIST: 'Provide Province/City from list',
  DONT_PROVIDE: `Don't want to specify Province/City`,
  CURRENT_CITY: (city: City) => `Current city: <b>${city}</b>`,
};

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  async (ctx) => {
    await ctx.reply(
      TEXT.HOW_PROVIDE_DETAILS,
      Markup.keyboard([
        Markup.button.locationRequest(TEXT.PROVIDE_LOCATION),
        Markup.button.text(TEXT.PROVIDE_FROM_LIST),
        Markup.button.text(TEXT.DONT_PROVIDE),
      ]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const state = ctx.wizard.state as IState;
    const text = (<Message.TextMessage>ctx.message)?.text as string;
    const location = (<Message.LocationMessage>ctx.message)?.location as Location;

    if (text === TEXT.DONT_PROVIDE) {
      return done();
    }

    if (location) {
      const url = new URL(`https://nominatim.openstreetmap.org/reverse?lon=${location.longitude}&lat=${location.latitude}&format=json`);
      const { data: { address: { city } } } = await axios(url.toString());

      await ctx.replyWithHTML(
        TEXT.CURRENT_CITY(city),
        Markup.removeKeyboard(),
      );

      state.criteria.city = city;
      return done();
    }

    await ctx.replyWithHTML(
      TEXT.PLEASE_SELECT,
      Markup.keyboard(
        Object.values(Province),
        { columns: 1 },
      ).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  (ctx, done) => {
    const state = ctx.wizard.state as IState;
    const message = ctx.message as Message.TextMessage;
    const province = message.text as Province;

    state.criteria.province = province;
    return done();
  },
];

export const createProvinceScene = wizardSceneFactory(
  Scene.Province,
  ...sceneSteps
);
