import { BotCommand } from './models';

export const LAUNCH_BOT_BACK_TEXT = `We launched your previously stopped bot back!\n
/${BotCommand.Print} - to print current settings criteria
/${BotCommand.Help} - to see all available commands`;

export const BOT_IS_NOT_WORKING_TEXT = `Bot isn't working for you. Please use /${BotCommand.Start} command in order to start bot`;

export const BOT_IS_WORKING_TEXT = `Bot is already working for you. Please use /${BotCommand.Update} command in order to update settings`;

export const STOP_COMMAND_TEXT = `Bot has been stopped. To start it back use /${BotCommand.Start} command`;

export const PAUSE_COMMAND_TEXT = `You stopped bot from sending new messages. To launched it back use /${BotCommand.Resume} command`;

export const RESUME_COMMAND_TEXT = `You launched bot for sending new messages. To stop it back use /${BotCommand.Pause} command`;

export const HELP_COMMAND_TEXT = `
  Commands and their descriptions:\n
/${BotCommand.Print}: Prints current settings criteria
/${BotCommand.Update}: Updates settings criteria
/${BotCommand.Pause}: Pauses bot from retrieving updates
/${BotCommand.Resume}: Resumes bot for retrieving updates
/${BotCommand.Stop}: Stops bot
`;
