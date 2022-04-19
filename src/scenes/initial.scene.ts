import axios from 'axios';
import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, BlitzResponse } from './models';
import { wizardSceneFactory } from './utils';

const TEXT = {
  HOW_PROVIDE_DETAILS: `How would you like to provide Province/City details?`,
};

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  async (ctx) => {
    await ctx.reply(
      TEXT.HOW_PROVIDE_DETAILS,
      Markup.keyboard([
        Markup.button.locationRequest('Provide location'),
        Markup.button.callback('Provide Province/City from list', BlitzResponse.Yes),
        Markup.button.callback(`Don't want to specify Province/City`, BlitzResponse.No),
      ]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const state = ctx.wizard.state as IState;
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataCallbackQuery;
    const inlineResponse = callbackQuery?.data as BlitzResponse;
    const message = ctx.message as Message.LocationMessage;

    if (message.location) {
      const { longitude, latitude } = message.location;
      const { data: { address } } = await axios(
        `https://nominatim.openstreetmap.org/reverse?lon=${longitude}&lat=${latitude}&format=json`
      );

      state.criteria.city = address.city;
    }

    return done();
  },
];

export const createInitialScene = wizardSceneFactory(
  Scene.Initial,
  ...sceneSteps
);
