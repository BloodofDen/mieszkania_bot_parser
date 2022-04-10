import * as dotenv from 'dotenv';
import { connect } from 'mongoose';
import { Telegraf, Scenes, session } from 'telegraf';
import { scenes } from './scenes';
import { Scene, IWizardState } from './models';

dotenv.config();

const {
  MONGODB_LOGIN,
  MONGODB_PASSWORD,
  NODE_ENV,
  BOT_TOKEN,
  DEFAULT_PARSING_FREQUENCY = 0.5,
} = process.env;

connect(`mongodb+srv://${MONGODB_LOGIN}:${MONGODB_PASSWORD}@defaultcluster.jb36q.mongodb.net/${NODE_ENV}?retryWrites=true&w=majority`)
  .then(async () => {
    console.log('DB Connection established!');

    const bot = new Telegraf<Scenes.WizardContext>(BOT_TOKEN!);
    const stage = new Scenes.Stage(scenes);

    bot.use(session());
    bot.use(stage.middleware());
    bot.start(({ from: user, scene }) => {
      const initialState: IWizardState = {
        user,
        criteria: {
          isPrivate: false,
        },
      };

      scene.enter(Scene.Province, initialState);
    });
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

    // setInterval(
    //   async () => {
    //     const activeUsersIds = await getActiveUsersIds();

    //     if (!activeUsersIds.length) {
    //       return;
    //     }

    //     const ads = (
    //       await Promise.all([parseOLX()])
    //       // await Promise.all([parseOLX(), parseOTODOM()])
    //     ).flat();

    //     console.log('ads::::', ads);

    //     // const diff = _.differenceWith(links, fileData.split('\n'), _.isEqual);
    //     // if (!diff.length) {
    //     //   return;
    //     // }

    //     // const message = diff.join('\n\n');
    //     // console.log('New Message:', message);

    //     // Promise.all([...CHATS.keys()].map((chat) => bot.telegram.sendMessage(chat, message)));
    //   },
    //   Number(DEFAULT_PARSING_FREQUENCY) * 60000,
    // );
  })
  .catch(err => console.error('Error:::', err));
