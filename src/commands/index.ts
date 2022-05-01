import { Scenes, MiddlewareFn } from 'telegraf';
import { Store } from '../store';
import { BotCommand as _BotCommand } from './models';
import {
  getOnStartHandler,
  getOnUpdateHandler,
  getOnPrintHandler,
  getOnStopHandler,
  getOnPauseHandler,
  getOnResumeHandler,
  getOnHelpHandler,
} from './handlers';

export import BotCommand = _BotCommand;

export const getCommandHandlerMapper = (
  store: Store,
): Record<BotCommand, MiddlewareFn<Scenes.WizardContext>> => ({
  [BotCommand.Start]: getOnStartHandler(store),
  [BotCommand.Update]: getOnUpdateHandler(store),
  [BotCommand.Print]: getOnPrintHandler(store),
  [BotCommand.Stop]: getOnStopHandler(store),
  [BotCommand.Pause]: getOnPauseHandler(store),
  [BotCommand.Resume]: getOnResumeHandler(store),
  [BotCommand.Help]: getOnHelpHandler(store),
});
