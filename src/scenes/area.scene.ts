import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { BotCommand } from '../commands';
import type { IState } from '../models';
import { Scene, BlitzResponse } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { LEAVE_BLANK, VALIDATOR, INLINE_ERROR_MESSAGE } from './constants';

const { REG_EXP, ERROR_MESSAGE } = VALIDATOR[Scene.Area];

const TEXT = {
  PLEASE_SPECIFY_MIN: {
    [BotCommand.Start]: `Please specify min <b>Area m²</b>:`,
    [BotCommand.Update]: `Please update min <b>Area m²</b>:`,
  },
  PLEASE_SPECIFY_MAX: {
    [BotCommand.Start]: `Please specify max <b>Area m²</b>:`,
    [BotCommand.Update]: `Please update max <b>Area m²</b>:`,
  },
  WANNA_SPECIFY: {
    [BotCommand.Start]: `Do you want to specify <b>Area m²</b>?`,
    [BotCommand.Update]: `Do you want to update <b>Area m²</b>?`,
  },
  MAX_CANT_BE_LESS_THAN_MIN: `Max <b>Area m²</b> can't be less that min!`,
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

      criteria.areaMin = valueMin;
    } else {
      delete criteria.areaMin;
    }

    await ctx.replyWithHTML(
      TEXT.PLEASE_SPECIFY_MAX[command],
      Markup.keyboard([LEAVE_BLANK]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  (ctx, done) => {
    const { criteria } = ctx.wizard.state as IState
    const minFieldNameValue = criteria.areaMin;
    const message = ctx.message as Message.TextMessage;
    const valueMaxStr = message.text;

    if (valueMaxStr === LEAVE_BLANK) {
      delete criteria.areaMax;
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

    criteria.areaMax = valueMax;
    return done();
  },
];

export const createAreaScene = wizardSceneFactory(
  Scene.Area,
  ...sceneSteps
);
