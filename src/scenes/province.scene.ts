import axios from 'axios';
import type { Message, Location } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { BotCommand } from '../commands';
import type { IState } from '../models';
import { Scene, Province, City } from './models';
import { wizardSceneFactory } from './utils';
import { VALIDATOR } from './constants';

const { ERROR_MESSAGE } = VALIDATOR[Scene.Province];

const TEXT = {
  HOW_PROVIDE_DETAILS: {
    [BotCommand.Start]: `How would you like to provide Province/City details?`,
    [BotCommand.Update]: `How would you like to update Province/City details?`,
  },
  PLEASE_SELECT: `Please select <b>Province</b>:`,
  PROVIDE_LOCATION: {
    [BotCommand.Start]: 'Provide location',
    [BotCommand.Update]: 'Update location',
  },
  PROVIDE_FROM_LIST: {
    [BotCommand.Start]: 'Provide Province/City from list',
    [BotCommand.Update]: 'Update Province/City from list',
  },
  DONT_PROVIDE: {
    [BotCommand.Start]: `Don't want to specify Province/City`,
    [BotCommand.Update]: `Don't want to update Province/City`,
  },
  CURRENT_CITY: (city: City) => `Current city: <b>${city}</b>`,
};

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  async (ctx) => {
    const { command } = ctx.wizard.state as IState;

    await ctx.reply(
      TEXT.HOW_PROVIDE_DETAILS[command],
      Markup.keyboard([
        Markup.button.locationRequest(TEXT.PROVIDE_LOCATION[command]),
        Markup.button.text(TEXT.PROVIDE_FROM_LIST[command]),
        Markup.button.text(TEXT.DONT_PROVIDE[command]),
      ]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const { criteria, command } = ctx.wizard.state as IState;
    const text = (<Message.TextMessage>ctx.message)?.text as string;
    const location = (<Message.LocationMessage>ctx.message)?.location as Location;

    if (location) {
      const url = new URL(`https://nominatim.openstreetmap.org/reverse?lon=${location.longitude}&lat=${location.latitude}&format=json`);
      const { data: { address: { city } } } = await axios(url.toString());

      await ctx.replyWithHTML(
        TEXT.CURRENT_CITY(city),
        Markup.removeKeyboard(),
      );

      delete criteria.province;
      criteria.city = city;

      return done();
    }

    switch (text) {
      case TEXT.DONT_PROVIDE[command]:
        return done();
      case TEXT.PROVIDE_FROM_LIST[command]:
        await ctx.replyWithHTML(
          TEXT.PLEASE_SELECT,
          Markup.keyboard(
            Object.values(Province),
            { columns: 1 },
          ).oneTime().resize(),
        );

        return ctx.wizard.next();
      default:
        return ctx.replyWithHTML(ERROR_MESSAGE);
    }
  },
  (ctx, done) => {
    const { criteria } = ctx.wizard.state as IState;
    const message = ctx.message as Message.TextMessage;
    const province = message.text as Province;

    if (!Object.values(Province).includes(province)) {
      return ctx.replyWithHTML(ERROR_MESSAGE);
    }

    criteria.province = province;
    delete criteria.city;

    return done();
  },
];

export const createProvinceScene = wizardSceneFactory(
  Scene.Province,
  ...sceneSteps
);
