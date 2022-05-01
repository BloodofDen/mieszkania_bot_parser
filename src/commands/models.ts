import { Scenes, MiddlewareFn } from 'telegraf';
import { Store } from '../store';

export enum BotCommand {
  Start = 'start',
  Update = 'update',
  Print = 'print',
  Stop = 'stop',
  Pause = 'pause',
  Resume = 'resume',
  Help = 'help',
};

export type GetCommandHandler = (store: Store) => MiddlewareFn<Scenes.WizardContext>;
