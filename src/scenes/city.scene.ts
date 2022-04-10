import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { Scene, BlitzResponse, IWizardState, City } from '../models';
import { PROVINCE_TO_CITY_MAPPER } from '../constants';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';

const TEXT = {
  PLEASE_SELECT: `Please select <b>${Scene.City}</b>:`,
  WANNA_SPECIFY: `Do you want to specify <b>${Scene.City}</b>?`,
};

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  getFirstSceneInlineQuestion(TEXT.WANNA_SPECIFY),
  async (ctx, done) => {
    const { criteria } = ctx.wizard.state as IWizardState;
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataCallbackQuery;
    const inlineResponse = callbackQuery.data as BlitzResponse;

    await ctx.editMessageText(
      `${TEXT.WANNA_SPECIFY}\nChoosen: <b>${inlineResponse}</b>`,
      { parse_mode: 'HTML' },
    );

    if (inlineResponse === BlitzResponse.No) {
      return done();
    }

    await ctx.replyWithHTML(
      TEXT.PLEASE_SELECT,
      Markup.keyboard(
        PROVINCE_TO_CITY_MAPPER[criteria.province!],
        { columns: 1 },
      ).oneTime(),
    );

    return ctx.wizard.next();
  },
  (ctx, done) => {
    const state = ctx.wizard.state as IWizardState;
    const message = ctx.message as Message.TextMessage;
    const city = message.text as City;

    state.criteria.city = city;
    return done();
  },
];

export const createCityScene = wizardSceneFactory(
  Scene.City,
  ...sceneSteps
);
