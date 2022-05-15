import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { BotCommand } from '../commands';
import type { IState } from '../models';
import { Scene, BlitzResponse, RoomsNumber } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { LEAVE_BLANK, VALIDATOR, INLINE_ERROR_MESSAGE } from './constants';

const { REG_EXP, ERROR_MESSAGE } = VALIDATOR[Scene.RoomsNumber];

const TEXT = {
  PLEASE_SPECIFY: {
    [BotCommand.Start]: `Please specify <b>Number of Rooms</b>:`,
    [BotCommand.Update]: `Please update <b>Number of Rooms</b>:`,
  },
  WANNA_SPECIFY: {
    [BotCommand.Start]: `Do you want to specify <b>Number of Rooms</b>?`,
    [BotCommand.Update]: `Do you want to update <b>Number of Rooms</b>?`,
  },
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
      TEXT.PLEASE_SPECIFY[command],
      Markup.keyboard([
        Object.keys(RoomsNumber).filter(key => Number(key)),
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

    if (!roomsNumberStr.match(REG_EXP!)) {
      return ctx.replyWithHTML(ERROR_MESSAGE);
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
