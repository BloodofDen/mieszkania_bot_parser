import { Scene } from '../scenes/models';
import { controller } from '../controllers';
import { IState, UserState } from '../models';
import { BotCommand, GetCommandHandler } from './models';
import {
  STOP_COMMAND_TEXT,
  PAUSE_COMMAND_TEXT,
  RESUME_COMMAND_TEXT,
  HELP_COMMAND_TEXT,
  LAUNCH_BOT_BACK_TEXT,
  BOT_IS_WORKING_TEXT,
  BOT_IS_NOT_WORKING_TEXT,
} from './constants';

export const getOnStartHandler: GetCommandHandler = (store) => async (ctx) => {
  const telegramId = ctx.from!.id;

  if (store.has(telegramId)) {
    return ctx.replyWithHTML(BOT_IS_WORKING_TEXT);
  }

  const user = await controller.user.update(telegramId, { currentState: UserState.Active });

  if (user) {
    await store.add(user);

    return ctx.replyWithHTML(LAUNCH_BOT_BACK_TEXT);
  } else {
    const initialState: IState = {
      user: ctx.from!,
      criteria: { isPrivate: false },
      store,
      command: BotCommand.Start,
    };

    ctx.scene.enter(Scene.Province, initialState);
  }
};

export const getOnUpdateHandler: GetCommandHandler = (store) => (ctx) => {
  const user = store.get(ctx.from!.id);

  if (!user) {
    return ctx.replyWithHTML(BOT_IS_NOT_WORKING_TEXT);
  }

  store.update(user.telegramId, { currentState: UserState.Paused });

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

  const dataToUpdate = { currentState: UserState.Stopped };

  store.remove(telegramId);
  await controller.user.update(telegramId, dataToUpdate);

  return ctx.reply(STOP_COMMAND_TEXT);
};

export const getOnPauseHandler: GetCommandHandler = (store) => async (ctx) => {
  const telegramId = ctx.from!.id;
  const user = store.get(telegramId);

  if (!user) {
    return ctx.reply(BOT_IS_NOT_WORKING_TEXT);
  }

  if (user.currentState !== UserState.Paused) {
    const dataToUpdate = { currentState: UserState.Paused };

    store.update(telegramId, dataToUpdate);
    await controller.user.update(telegramId, dataToUpdate);
  }

  return ctx.reply(PAUSE_COMMAND_TEXT);
};

export const getOnResumeHandler: GetCommandHandler = (store) => async (ctx) => {
  const telegramId = ctx.from!.id;
  const user = store.get(telegramId);

  if (!user) {
    return ctx.reply(BOT_IS_NOT_WORKING_TEXT);
  }

  if (user.currentState !== UserState.Active) {
    const dataToUpdate = { currentState: UserState.Active };

    store.update(telegramId, dataToUpdate);
    await controller.user.update(telegramId, dataToUpdate);
  }

  return ctx.reply(RESUME_COMMAND_TEXT);
};

export const getOnHelpHandler: GetCommandHandler = (_store) => (ctx) => {
  return ctx.reply(HELP_COMMAND_TEXT);
};
