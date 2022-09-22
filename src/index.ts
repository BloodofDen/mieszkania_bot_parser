import * as dotenv from 'dotenv';
import { connect } from 'mongoose';
import { Telegraf, Scenes, session } from 'telegraf';
import { controller } from './controllers';
import { scenes } from './scenes';
import { Store } from './store';
import type { StoreCallback } from './models';
import { validateEnvVars, createStoreCallback, stopBot } from './utils';
import { BotCommand, getCommandHandlerMapper } from './commands';

dotenv.config();

validateEnvVars();

const {
  MONGODB_LOGIN,
  MONGODB_PASSWORD,
  MONGODB_HOST,
  NODE_ENV,
  BOT_TOKEN,
  PORT,
  DOMAIN,
} = process.env;

const MONGODB_PATH = `mongodb+srv://${MONGODB_LOGIN}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${NODE_ENV}?retryWrites=true&w=majority`;

async function runBot(): Promise<void> {
  const bot = new Telegraf<Scenes.WizardContext>(BOT_TOKEN!);
  const stage = new Scenes.Stage(scenes);

  const users = await controller.user.getAll();

  const storeCallback: StoreCallback = createStoreCallback(bot);

  const store = new Store(storeCallback);
  await store.setup(users);

  const commandHandlerMapper = getCommandHandlerMapper(store);

  if (NODE_ENV !== 'production') {
    bot.use(Telegraf.log());
  }

  bot.use(session());
  bot.use(stage.middleware());

  Object.values(BotCommand).forEach(
    command => bot.command(
      command,
      commandHandlerMapper[command],
    ),
  );

  bot.launch({
    webhook: NODE_ENV === 'production' ? {
        port: Number(PORT),
        domain: DOMAIN!
      } : undefined,
  });

  // Enable graceful stop
  // ctrl + c event:
  process.once('SIGINT', stopBot(bot, store, 'SIGINT'));
  // kill, pkill, killall event:
  process.once('SIGTERM', stopBot(bot, store, 'SIGTERM'));
}

connect(MONGODB_PATH)
  .then(() => console.log('DB Connection established!'))
  .then(runBot)
  .catch(e => console.error('Error:::', e));
