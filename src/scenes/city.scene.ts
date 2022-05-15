import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { BotCommand } from '../commands';
import type { IState } from '../models';
import { Scene, BlitzResponse, City } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { PROVINCE_TO_CITY_MAPPER } from './mappers';
import { VALIDATOR, INLINE_ERROR_MESSAGE } from './constants';

const { ERROR_MESSAGE } = VALIDATOR[Scene.City];

const TEXT = {
  PLEASE_SELECT: {
    [BotCommand.Start]: `Please select <b>City</b>:`,
    [BotCommand.Update]: `Please update <b>City</b>:`,
  },
  WANNA_SPECIFY: {
    [BotCommand.Start]: `Do you want to specify <b>City</b>?`,
    [BotCommand.Update]: `Do you want to update <b>City</b>?`,
  }
};

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  getFirstSceneInlineQuestion(TEXT.WANNA_SPECIFY),
  async (ctx, done) => {
    const { criteria, command } = ctx.wizard.state as IState;
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
      TEXT.PLEASE_SELECT[command],
      Markup.keyboard(
        PROVINCE_TO_CITY_MAPPER[criteria.province!],
        { columns: 1 },
      ).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  (ctx, done) => {
    const { criteria } = ctx.wizard.state as IState;
    const message = ctx.message as Message.TextMessage;
    const city = message.text as City;

    if (!Object.values(City).includes(city)) {
      return ctx.replyWithHTML(ERROR_MESSAGE);
    }

    criteria.city = city;
    return done();
  },
];

export const createCityScene = wizardSceneFactory(
  Scene.City,
  ...sceneSteps
);
