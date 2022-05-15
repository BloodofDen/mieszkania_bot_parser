import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { BotCommand } from '../commands';
import type { IState } from '../models';
import { Scene, BlitzResponse } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { LEAVE_BLANK, VALIDATOR, INLINE_ERROR_MESSAGE } from './constants';

const { REG_EXP, ERROR_MESSAGE } = VALIDATOR[Scene.Price];

const TEXT = {
  PLEASE_SPECIFY_MIN: {
    [BotCommand.Start]: `Please specify min <b>Price</b> (in PLN):`,
    [BotCommand.Update]: `Please update min <b>Price</b> (in PLN):`,
  },
  PLEASE_SPECIFY_MAX: {
    [BotCommand.Start]: `Please specify max <b>Price</b> (in PLN):`,
    [BotCommand.Update]: `Please update max <b>Price</b> (in PLN):`,
  },
  WANNA_SPECIFY: {
    [BotCommand.Start]: `Do you want to specify <b>Price</b>?`,
    [BotCommand.Update]: `Do you want to update <b>Price</b>?`,
  },
  MAX_CANT_BE_LESS_THAN_MIN: `Max <b>Price</b> can't be less that min!`,
};

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  getFirstSceneInlineQuestion(TEXT.WANNA_SPECIFY),
  async (ctx, done) => {
    const { command } = ctx.wizard.state as IState;
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataCallbackQuery;
    const inlineResponse = callbackQuery?.data as BlitzResponse;

    if (!inlineResponse) {
      return ctx.replyWithHTML(INLINE_ERROR_MESSAGE);
    }

    await ctx.editMessageText(
      `${TEXT.WANNA_SPECIFY}\nChoosen: <b>${inlineResponse}</b>`,
      { parse_mode: 'HTML' },
    );

    if (inlineResponse === BlitzResponse.No) {
      return done();
    }

    await ctx.replyWithHTML(
      TEXT.PLEASE_SPECIFY_MIN[command],
      Markup.keyboard([LEAVE_BLANK]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    const { criteria, command } = ctx.wizard.state as IState
    const message = ctx.message as Message.TextMessage;
    const valueMinStr = message.text;
    const isInputValid = valueMinStr.match(REG_EXP!);

    if (valueMinStr !== LEAVE_BLANK && !isInputValid) {
      return ctx.replyWithHTML(ERROR_MESSAGE);
    }

    if (isInputValid) {
      const valueMin = parseInt(valueMinStr, 10);

      criteria.priceMin = valueMin;
    } else {
      delete criteria.priceMin;
    }

    await ctx.replyWithHTML(
      TEXT.PLEASE_SPECIFY_MAX[command],
      Markup.keyboard([LEAVE_BLANK]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const { criteria } = ctx.wizard.state as IState;
    const minFieldNameValue = criteria.priceMin;
    const message = ctx.message as Message.TextMessage;
    const valueMaxStr = message.text;

    if (valueMaxStr === LEAVE_BLANK) {
      delete criteria.priceMax;
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

    criteria.priceMax = valueMax;
    return done();
  },
];

export const createPriceScene = wizardSceneFactory(
  Scene.Price,
  ...sceneSteps
);
