import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { Scene, BlitzResponse, IWizardState, RoomsNumber } from '../models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';

const TEXT = {
  PLEASE_SPECIFY: `Please specify <b>${Scene.RoomsNumber}</b>:`,
  WANNA_SPECIFY: `Do you want to specify <b>${Scene.RoomsNumber}</b>?`,
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
      TEXT.PLEASE_SPECIFY,
      Markup.keyboard([
        Object.keys(RoomsNumber).filter(key => Number(key)),
        ['Leave Blank'],
      ]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const state = ctx.wizard.state as IWizardState;
    const message = ctx.message as Message.TextMessage;
    const roomsNumberStr = message.text;

    if (roomsNumberStr === 'Leave Blank') {
      return done();
    }

    if (!roomsNumberStr.match(/^[0-4]$/)) {
      return;
    }

    const roomsNumber = parseInt(roomsNumberStr, 10);

    state.criteria.roomsNumber = roomsNumber;
    return done();
  },
];

export const createRoomsNumberScene = wizardSceneFactory(
  Scene.RoomsNumber,
  ...sceneSteps
);
