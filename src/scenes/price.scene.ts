import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, BlitzResponse } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { LEAVE_BLANK, VALIDATOR } from './constants';

const { REG_EXP, ERROR_MESSAGE } = VALIDATOR[Scene.Price];

const TEXT = {
  PLEASE_SPECIFY_MIN: `Please specify min <b>${Scene.Price}</b> (in PLN):`,
  PLEASE_SPECIFY_MAX: `Please specify max <b>${Scene.Price}</b> (in PLN):`,
  WANNA_SPECIFY: `Do you want to specify <b>${Scene.Price}</b>?`,
  MAX_CANT_BE_LESS_THAN_MIN: `Max <b>${Scene.Price}</b> can't be less that min!`,
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
      Markup.keyboard([LEAVE_BLANK]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    const state = ctx.wizard.state as IState
    const message = ctx.message as Message.TextMessage;
    const valueMinStr = message.text;
    const isInputValid = valueMinStr.match(REG_EXP!);

    if (valueMinStr !== LEAVE_BLANK && !isInputValid) {
      return ctx.replyWithHTML(ERROR_MESSAGE);
    }

    if (isInputValid) {
      const valueMin = parseInt(valueMinStr, 10);

      state.criteria.priceMin = valueMin;
    }

    await ctx.replyWithHTML(
      TEXT.PLEASE_SPECIFY_MAX,
      Markup.keyboard([LEAVE_BLANK]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const state = ctx.wizard.state as IState;
    const minFieldNameValue = state.criteria.priceMin;
    const message = ctx.message as Message.TextMessage;
    const valueMaxStr = message.text;

    if (valueMaxStr === LEAVE_BLANK) {
      return done();
    }

    const isInputValid = valueMaxStr.match(REG_EXP!);
    if (!isInputValid) {
      return ctx.replyWithHTML(ERROR_MESSAGE);
    }

    const valueMax = parseInt(valueMaxStr, 10);

    if (minFieldNameValue && minFieldNameValue > valueMax) {
      return ctx.replyWithHTML(TEXT.MAX_CANT_BE_LESS_THAN_MIN);
    }

    state.criteria.priceMax = valueMax;
    return done();
  },
];

export const createPriceScene = wizardSceneFactory(
  Scene.Price,
  ...sceneSteps
);
