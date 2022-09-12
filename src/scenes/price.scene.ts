import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, BlitzResponse } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { LEAVE_BLANK, SCENE_TO_VALIDATOR_MAPPER, SCENE_TO_TEXT_MAPPER } from './constants';

const TEXT = SCENE_TO_TEXT_MAPPER[Scene.Price];
const VALIDATOR = SCENE_TO_VALIDATOR_MAPPER[Scene.Price];

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  getFirstSceneInlineQuestion(TEXT),
  async (ctx, done) => {
    const { command } = ctx.wizard.state as IState;
    const callbackQuery = ctx.callbackQuery as CallbackQuery;
    const inlineResponse = callbackQuery?.data as BlitzResponse;

    if (!inlineResponse) {
      return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.INLINE_OMITTED!);
    }

    await ctx.editMessageText(
      `${TEXT[command].INLINE_QUESTION}\nChoosen: <b>${inlineResponse}</b>`,
      { parse_mode: 'HTML' },
    );

    if (inlineResponse === BlitzResponse.No) {
      return done();
    }

    await ctx.replyWithHTML(
      TEXT[command].MIN_PRICE!,
      Markup.keyboard([LEAVE_BLANK]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    const { criteria, command } = ctx.wizard.state as IState
    const message = ctx.message as Message.TextMessage;
    const valueMinStr = message.text;
    const isInputValid = valueMinStr.match(VALIDATOR.REG_EXP_PATTERN!);

    if (valueMinStr !== LEAVE_BLANK && !isInputValid) {
      return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.WRONG_VALUE);
    }

    if (isInputValid) {
      const valueMin = parseInt(valueMinStr, 10);

      criteria.priceMin = valueMin;
    } else {
      delete criteria.priceMin;
    }

    await ctx.replyWithHTML(
      TEXT[command].MAX_PRICE!,
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

    const isInputValid = valueMaxStr.match(VALIDATOR.REG_EXP_PATTERN!);
    if (!isInputValid) {
      return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.WRONG_VALUE);
    }

    const valueMax = parseInt(valueMaxStr, 10);

    if (minFieldNameValue && minFieldNameValue > valueMax) {
      return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.MAX_CANT_BE_LESS_THAN_MIN!);
    }

    criteria.priceMax = valueMax;
    return done();
  },
];

export const createPriceScene = wizardSceneFactory(
  Scene.Price,
  ...sceneSteps
);
