import * as dotenv from 'dotenv';
import { connect } from 'mongoose';
import { Telegraf, Scenes, session } from 'telegraf';
import { userController } from './controllers';
import { scenes } from './scenes';
import { Store } from './store';
import { Scene, IState } from './models';

dotenv.config();

const {
  MONGODB_LOGIN,
  MONGODB_PASSWORD,
  NODE_ENV,
  BOT_TOKEN,
} = process.env;

connect(`mongodb+srv://${MONGODB_LOGIN}:${MONGODB_PASSWORD}@defaultcluster.jb36q.mongodb.net/${NODE_ENV}?retryWrites=true&w=majority`)
  .then(async () => {
    console.log('DB Connection established!');

    const bot = new Telegraf<Scenes.WizardContext>(BOT_TOKEN!);
    const stage = new Scenes.Stage(scenes);

    const store = new Store(bot);
    await store.setup(
      await userController.getUsers(),
    );

    bot.use(session());
    bot.use(stage.middleware());
    bot.start(async ({ from: user, scene }) => {
      const initialState: IState = {
        user,
        criteria: {
          isPrivate: false,
        },
        store,
      };

      scene.enter(Scene.Province, initialState);
    });
    bot.command('stop', (ctx) => store.remove(ctx.from.id));
    bot.launch();

    // bot.command('quit', (ctx) => {
    //   // Explicit usage
    //   ctx.telegram.leaveChat(ctx.message.chat.id);
    // // Context shortcut
    //   ctx.leaveChat();
    // });

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  })
  .catch(err => console.error('Error:::', err));
