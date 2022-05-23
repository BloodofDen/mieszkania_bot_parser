import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, BlitzResponse, RoomsNumber } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { LEAVE_BLANK, SCENE_TO_VALIDATOR_MAPPER, SCENE_TO_TEXT_MAPPER } from './constants';

const TEXT = SCENE_TO_TEXT_MAPPER[Scene.RoomsNumber];
const VALIDATOR = SCENE_TO_VALIDATOR_MAPPER[Scene.RoomsNumber];

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  getFirstSceneInlineQuestion(TEXT),
  async (ctx, done) => {
    const { command } = ctx.wizard.state as IState;
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataCallbackQuery;
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
      TEXT[command].ROOMS_NUMBER!,
      Markup.keyboard([
        Object.keys(RoomsNumber).filter(Number),
        [LEAVE_BLANK],
      ]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const { criteria } = ctx.wizard.state as IState;
    const message = ctx.message as Message.TextMessage;
    const roomsNumberStr = message.text;

    if (roomsNumberStr === LEAVE_BLANK) {
      delete criteria.roomsNumber;
      return done();
    }

    if (!roomsNumberStr.match(VALIDATOR.REG_EXP_PATTERN!)) {
      return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.WRONG_VALUE);
    }

    const roomsNumber = parseInt(roomsNumberStr, 10);

    criteria.roomsNumber = roomsNumber;
    return done();
  },
];

export const createRoomsNumberScene = wizardSceneFactory(
  Scene.RoomsNumber,
  ...sceneSteps
);
