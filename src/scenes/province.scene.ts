import axios from 'axios';
import type { Message, Location, CallbackQuery } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { BotCommand } from '../commands';
import type { IState } from '../models';
import { Scene, Province, BlitzResponse } from './models';
import { wizardSceneFactory, getFirstSceneInlineQuestion } from './utils';
import { LEAVE_BLANK, SCENE_TO_VALIDATOR_MAPPER, SCENE_TO_TEXT_MAPPER } from './constants';

const TEXT = SCENE_TO_TEXT_MAPPER[Scene.Province];
const VALIDATOR = SCENE_TO_VALIDATOR_MAPPER[Scene.Province];

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  async (ctx, done) => {
    const { command } = ctx.wizard.state as IState;

    if (command === BotCommand.Update) {
      return getFirstSceneInlineQuestion(TEXT)(ctx, done);
    }

    ctx.wizard.next();
    return (<MiddlewareFn<Scenes.WizardContext>>ctx.wizard.step)(ctx, done);
  },
  async (ctx, done) => {
    const { command } = ctx.wizard.state as IState;
    const callbackQuery = ctx.callbackQuery as CallbackQuery.DataCallbackQuery;
    const inlineResponse = callbackQuery?.data as BlitzResponse;

    if (inlineResponse) {
      await ctx.editMessageText(
        `${TEXT[command].INLINE_QUESTION}\nChoosen: <b>${inlineResponse}</b>`,
        { parse_mode: 'HTML' },
      );

      if (inlineResponse === BlitzResponse.No) {
        return done();
      }
    }

    await ctx.reply(
      TEXT[command].HOW_PROVIDE_DETAILS!,
      Markup.keyboard([
        Markup.button.locationRequest(TEXT[command].LOCATION!),
        Markup.button.text(TEXT[command].FROM_LIST!),
        Markup.button.text(LEAVE_BLANK),
      ]).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const { criteria, command } = ctx.wizard.state as IState;
    const text = (<Message.TextMessage>ctx.message)?.text as string;
    const location = (<Message.LocationMessage>ctx.message)?.location as Location;

    if (location) {
      const url = new URL(`https://nominatim.openstreetmap.org/reverse?lon=${location.longitude}&lat=${location.latitude}&format=json`);
      const { data: { address: { city } } } = await axios(url.toString());

      await ctx.replyWithHTML(
        TEXT[command].CURRENT_CITY + city,
        Markup.removeKeyboard(),
      );

      delete criteria.province;
      criteria.city = city;

      return done();
    }

    switch (text) {
      case LEAVE_BLANK:
        delete criteria.province;
        delete criteria.city;

        return done();
      case TEXT[command].FROM_LIST!:
        await ctx.replyWithHTML(
          TEXT[command].SELECT_PROVINCE!,
          Markup.keyboard(
            Object.values(Province),
            { columns: 1 },
          ).oneTime().resize(),
        );

        return ctx.wizard.next();
      default:
        return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.WRONG_VALUE);
    }
  },
  (ctx, done) => {
    const { criteria } = ctx.wizard.state as IState;
    const message = ctx.message as Message.TextMessage;
    const province = message.text as Province;

    if (!Object.values(Province).includes(province)) {
      return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.WRONG_VALUE);
    }

    criteria.province = province;
    delete criteria.city;

    return done();
  },
];

export const createProvinceScene = wizardSceneFactory(
  Scene.Province,
  ...sceneSteps
);
