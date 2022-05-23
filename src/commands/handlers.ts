import { Scene } from '../scenes/models';
import { controller } from '../controllers';
import type { IState } from '../models';
import { BotCommand, GetCommandHandler } from './models';
import {
  START_COMMAND_TEXT,
  UPDATE_COMMAND_TEXT,
  STOP_COMMAND_TEXT,
  PAUSE_COMMAND_TEXT,
  RESUME_COMMAND_TEXT,
  HELP_COMMAND_TEXT,
  BOT_IS_NOT_WORKING_TEXT,
} from './constants';

export const getOnStartHandler: GetCommandHandler = (store) => (ctx) => {
  if (store.has(ctx.from!.id)) {
    return ctx.replyWithHTML(START_COMMAND_TEXT);
  }

  const initialState: IState = {
    user: ctx.from!,
    criteria: { isPrivate: false },
    store,
    command: BotCommand.Start,
  };

  ctx.scene.enter(Scene.Province, initialState);
};

export const getOnUpdateHandler: GetCommandHandler = (store) => (ctx) => {
  const user = store.get(ctx.from!.id);

  if (!user) {
    return ctx.replyWithHTML(UPDATE_COMMAND_TEXT);
  }

  store.removeTimer(user.telegramId);

  const initialState: IState = {
    user: ctx.from!,
    criteria: { ...user.criteria },
    store,
    command: BotCommand.Update,
  };

  ctx.scene.enter(Scene.Province, initialState);
};

export const getOnPrintHandler: GetCommandHandler = (store) => (ctx) => {
  const telegramId = ctx.from!.id;
  const user = store.get(telegramId);

  if (user) {
    const sentences = [
      'Here is your search criteria:\n',
      user.criteria.roomsNumber ? `Rooms Number: <b>${user.criteria.roomsNumber}</b>` : null,
      user.criteria.priceMin ? `Price min: <b>${user.criteria.priceMin}</b> PLN` : null,
      user.criteria.priceMax ? `Price max: <b>${user.criteria.priceMax}</b> PLN` : null,
      user.criteria.areaMin ? `Area min: <b>${user.criteria.areaMin}</b> m²` : null,
      user.criteria.areaMax ? `Area max: <b>${user.criteria.areaMax}</b> m²` : null,
      user.criteria.province ? `Province: <b>${user.criteria.province}</b>` : null,
      user.criteria.city ? `City: <b>${user.criteria.city}</b>` : null,
      user.criteria.isPrivate ? `Only <b>Private</b> advertisements will be shown`: null,
    ];
    const message = sentences.filter(Boolean).join('\n');

    return ctx.replyWithHTML(message);
  } else {
    return ctx.reply(BOT_IS_NOT_WORKING_TEXT);
  }
};

export const getOnStopHandler: GetCommandHandler = (store) => async (ctx) => {
  const telegramId = ctx.from!.id;

  if (!store.has(telegramId)) {
    return ctx.reply(BOT_IS_NOT_WORKING_TEXT);
  }

  store.remove(telegramId);
  await controller.user.deleteUser(telegramId);

  return ctx.reply(STOP_COMMAND_TEXT);
};

export const getOnPauseHandler: GetCommandHandler = (store) => (ctx) => {
  const telegramId = ctx.from!.id;

  if (!store.has(telegramId)) {
    return ctx.reply(BOT_IS_NOT_WORKING_TEXT);
  }

  store.removeTimer(telegramId);

  return ctx.reply(PAUSE_COMMAND_TEXT);
};

export const getOnResumeHandler: GetCommandHandler = (store) => (ctx) => {
  const telegramId = ctx.from!.id;

  if (!store.has(telegramId)) {
    return ctx.reply(BOT_IS_NOT_WORKING_TEXT);
  }

  store.setTimer(telegramId);

  return ctx.reply(RESUME_COMMAND_TEXT);
};

export const getOnHelpHandler: GetCommandHandler = (_store) => (ctx) => {
  return ctx.reply(HELP_COMMAND_TEXT);
};
