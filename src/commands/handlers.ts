import { Scene } from '../scenes/models';
import type { IState } from '../models';
import { BotCommand, GetCommandHandler } from './models';

export const getOnStartHandler: GetCommandHandler = (store) => (ctx) => {
  const user = store.users.get(ctx.from!.id);

  if (user) {
    return ctx.replyWithHTML(
      `Bot is already working for <b>${ctx.from!.first_name}</b>
      Please use /${BotCommand.Update} command in order to update settings`,
    );
  }

  const initialState: IState = {
    user: ctx.from!,
    criteria: { isPrivate: false },
    store,
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
  };

  ctx.scene.enter(Scene.Province, initialState);
};

export const getOnPrintHandler: GetCommandHandler = (store) => (ctx) => {
  const user = store.users.get(ctx.from!.id);

  if (user) {
    const sentences = [
      'Here is your search criteria:',
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
    return ctx.reply('No user found, start the bot!');
  }
};

export const getOnStopHandler: GetCommandHandler = (store) => ({ from: user }) => store.remove(user!.id);

export const getOnPauseHandler: GetCommandHandler = (store) => ({ from: user }) => store.removeTimer(user!.id);

export const getOnResumeHandler: GetCommandHandler = (store) => ({ from: user }) => store.setTimer(user!.id);

export const getOnHelpHandler: GetCommandHandler = (_store) => (ctx) => {
  const message = `
    Here are the commands and their description:
/${BotCommand.Print}: Prints current settings criteria
/${BotCommand.Update}: Updates settings criteria
/${BotCommand.Pause}: Pauses bot from retrieving updates
/${BotCommand.Resume}: Resumes bot for retrieving updates
/${BotCommand.Stop}: Stops bot
  `;

  return ctx.reply(message);
};
