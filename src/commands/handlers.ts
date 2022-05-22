import { Scene } from '../scenes/models';
import { controller } from '../controllers';
import type { IState } from '../models';
import { BotCommand, GetCommandHandler } from './models';
import { DEFAULT_NO_USER_FOUND_TEXT } from './constants';

export const getOnStartHandler: GetCommandHandler = (store) => (ctx) => {
  const isUserAlreadyInStore = store.has(ctx.from!.id);

  if (isUserAlreadyInStore) {
    return ctx.replyWithHTML(
      `Bot is already working for <b>${ctx.from!.first_name}</b>
Please use /${BotCommand.Update} command in order to update settings`,
    );
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
  const user = store.users.get(ctx.from!.id);

  if (!user) {
    return ctx.replyWithHTML(
      `Bot isn't working for <b>${ctx.from!.first_name}</b>
Please use /${BotCommand.Start} command in order to start bot`,
    );
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
  const user = store.users.get(telegramId);

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
    return ctx.reply(DEFAULT_NO_USER_FOUND_TEXT);
  }
};

export const getOnStopHandler: GetCommandHandler = (store) => async (ctx) => {
  const telegramId = ctx.from!.id;
  const isUserAlreadyInStore = store.has(telegramId);

  if (!isUserAlreadyInStore) {
    return ctx.reply(DEFAULT_NO_USER_FOUND_TEXT);
  }

  store.remove(telegramId);
  await controller.user.deleteUser(telegramId);

  return ctx.reply(`Bot has been stopped`);
};

export const getOnPauseHandler: GetCommandHandler = (store) => (ctx) => {
  const telegramId = ctx.from!.id;
  const isUserAlreadyInStore = store.has(telegramId);

  if (!isUserAlreadyInStore) {
    return ctx.reply(DEFAULT_NO_USER_FOUND_TEXT);
  }

  store.removeTimer(telegramId);

  return ctx.reply(`You stopped bot from sending new messages`);
};

export const getOnResumeHandler: GetCommandHandler = (store) => (ctx) => {
  const telegramId = ctx.from!.id;
  const isUserAlreadyInStore = store.has(telegramId);

  if (!isUserAlreadyInStore) {
    return ctx.reply(DEFAULT_NO_USER_FOUND_TEXT);
  }

  store.setTimer(telegramId);

  return ctx.reply(`You launched bot for sending new messages`);
};

export const getOnHelpHandler: GetCommandHandler = (_store) => (ctx) => {
  const message = `
    Commands and their description:\n
/${BotCommand.Print}: Prints current settings criteria
/${BotCommand.Update}: Updates settings criteria
/${BotCommand.Pause}: Pauses bot from retrieving updates
/${BotCommand.Resume}: Resumes bot for retrieving updates
/${BotCommand.Stop}: Stops bot
  `;

  return ctx.reply(message);
};
