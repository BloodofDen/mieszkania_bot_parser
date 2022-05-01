import * as dotenv from 'dotenv';
import { connect } from 'mongoose';
import { Telegraf, Scenes, session } from 'telegraf';
import { Controller } from './controllers';
import { scenes } from './scenes';
import { Store } from './store';
import type { StoreCallback } from './models';
import { createStoreCallback, stopBot } from './utils';
import { BotCommand, getCommandHandlerMapper } from './commands';

dotenv.config();

const {
  MONGODB_LOGIN,
  MONGODB_PASSWORD,
  NODE_ENV,
  BOT_TOKEN,
} = process.env;

const MONGODB_PATH = `mongodb+srv://${MONGODB_LOGIN}:${MONGODB_PASSWORD}@defaultcluster.jb36q.mongodb.net/${NODE_ENV}?retryWrites=true&w=majority`;

connect(MONGODB_PATH)
  .then(runBot)
  .catch(err => console.error('Error:::', err));

async function runBot(): Promise<void> {
  console.log('DB Connection established!');

  const bot = new Telegraf<Scenes.WizardContext>(BOT_TOKEN!);
  const stage = new Scenes.Stage(scenes);

  const controller = new Controller();
  const users = await controller.user.getUsers();

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
    command =>
      bot.command(
        command,
        commandHandlerMapper[command],
      ),
  );

  bot.launch();

  // Enable graceful stop
  // ctrl + c event:
  process.once('SIGINT', stopBot(bot, store, 'SIGINT'));
  // kill, pkill, killall event:
  process.once('SIGTERM', stopBot(bot, store, 'SIGTERM'));
}
