import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { Scene, BlitzResponse, IWizardState } from '../models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';

const TEXT = {
  PLEASE_SPECIFY_MIN: `Please specify min <b>${Scene.Price} in PLN</b>:`,
  PLEASE_SPECIFY_MAX: `Please specify max <b>${Scene.Price} in PLN</b>:`,
  WANNA_SPECIFY: `Do you want to specify <b>${Scene.Price} in PLN</b>?`,
  MAX_CANT_BE_LESS_THAN_MIN: `Max <b>${Scene.Price} in PLN</b> can't be less that min!`,
};

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  getFirstSceneInlineQuestion(TEXT.WANNA_SPECIFY),
  async (ctx, done) => {
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
      TEXT.PLEASE_SPECIFY_MIN,
      Markup.keyboard(['Leave Blank']).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    const state = ctx.wizard.state as IWizardState
    const message = ctx.message as Message.TextMessage;
    const valueMinStr = message.text;

    if (valueMinStr === 'Leave Blank') {
      return ctx.wizard.next();
    }

    if (!valueMinStr.match(/^[0-9]*\.?[0-9]*$/)) {
      return;
    }

    const valueMin = parseInt(valueMinStr, 10);

    state.criteria.priceMin = valueMin;

    await ctx.replyWithHTML(
      TEXT.PLEASE_SPECIFY_MAX,
      Markup.keyboard(['Leave Blank']).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const state = ctx.wizard.state as IWizardState;
    const minFieldNameValue = state.criteria.priceMin;
    const message = ctx.message as Message.TextMessage;
    const valueMaxStr = message.text;

    if (valueMaxStr === 'Leave Blank') {
      return done();
    }

    if (!valueMaxStr.match(/^[0-9]*\.?[0-9]*$/)) {
      return;
    }

    const valueMax = parseInt(valueMaxStr, 10);

    if (minFieldNameValue && minFieldNameValue > valueMax) {
      await ctx.replyWithHTML(TEXT.MAX_CANT_BE_LESS_THAN_MIN);

      return;
    }

    state.criteria.priceMax = valueMax;
    return done();
  },
];

export const createPriceScene = wizardSceneFactory(
  Scene.Price,
  ...sceneSteps
);
