import { BotCommand } from './models';

export const BOT_IS_NOT_WORKING_TEXT = `Bot isn't working for you\nPlease use /${BotCommand.Start} command in order to start bot`;

export const START_COMMAND_TEXT = `Bot is already working for you\nPlease use /${BotCommand.Update} command in order to update settings`;

export const UPDATE_COMMAND_TEXT = BOT_IS_NOT_WORKING_TEXT;

export const STOP_COMMAND_TEXT = `Bot has been stopped`;

export const PAUSE_COMMAND_TEXT = `You stopped bot from sending new messages`;

export const RESUME_COMMAND_TEXT = `You launched bot for sending new messages`;

export const HELP_COMMAND_TEXT = `
  Commands and their descriptions:\n
/${BotCommand.Print}: Prints current settings criteria
/${BotCommand.Update}: Updates settings criteria
/${BotCommand.Pause}: Pauses bot from retrieving updates
/${BotCommand.Resume}: Resumes bot for retrieving updates
/${BotCommand.Stop}: Stops bot
`;
