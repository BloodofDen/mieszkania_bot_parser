import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, BlitzResponse, Province } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';

const TEXT = {
  PLEASE_SELECT: `Please select <b>${Scene.Province}</b>:`,
  WANNA_SPECIFY: `Do you want to specify <b>${Scene.Province}</b>?`,
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
      TEXT.PLEASE_SELECT,
      Markup.keyboard(
        Object.values(Province),
        { columns: 1 },
      ).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  (ctx, done) => {
    const state = ctx.wizard.state as IState;
    const message = ctx.message as Message.TextMessage;
    const province = message.text as Province;

    state.criteria.province = province;
    return done();
  },
];

export const createProvinceScene = wizardSceneFactory(
  Scene.Province,
  ...sceneSteps
);
