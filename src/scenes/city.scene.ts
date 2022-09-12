import type { Message, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, BlitzResponse, City } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { SCENE_TO_VALIDATOR_MAPPER, SCENE_TO_TEXT_MAPPER, PROVINCE_TO_CITY_MAPPER } from './constants';

const TEXT = SCENE_TO_TEXT_MAPPER[Scene.City];
const VALIDATOR = SCENE_TO_VALIDATOR_MAPPER[Scene.City];

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  getFirstSceneInlineQuestion(TEXT),
  async (ctx, done) => {
    const { criteria, command } = ctx.wizard.state as IState;
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
      TEXT[command].SELECT_CITY!,
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
      return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.WRONG_VALUE);
    }

    criteria.city = city;
    return done();
  },
];

export const createCityScene = wizardSceneFactory(
  Scene.City,
  ...sceneSteps
);
