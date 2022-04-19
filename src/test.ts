import * as dotenv from 'dotenv';
import axios from 'axios';
import { Telegraf, Markup, Scenes, session } from 'telegraf';

dotenv.config();

const { BOT_TOKEN } = process.env;

const bot = new Telegraf(BOT_TOKEN!);
const stage = new Scenes.Stage([
  new Scenes.WizardScene<any>(
    'test',
    async (ctx) => {
      await ctx.reply(`Give us location`, Markup.keyboard([
        Markup.button.locationRequest('Check weather'),
        Markup.button.text('Cancel'),
      ]).resize());

      return ctx.wizard.next();
    },
    async (ctx) => {
      const { longitude, latitude } = ctx.message.location;
      const { data: { address } } = await axios(
        `https://nominatim.openstreetmap.org/reverse?lon=${longitude}&lat=${latitude}&format=json`
      );

      await ctx.replyWithHTML(`Is your city <b>${address.city}</b>?`, Markup.keyboard([
        'Yes',
        `No, I'd like to specify it manually`,
      ]).oneTime().resize());

      return ctx.wizard.next();
    },
    async (ctx) => {
      console.log('ctx.message.text:::', ctx.message.text);

      return ctx.scene.leave();
    },
  ),
]);

bot.use(session());
bot.use(stage.middleware());
// bot.command("/sendlocation", (ctx) => {
//   ctx.telegram.sendLocation(chat.id , latitude, longitude)
// });
bot.use(Telegraf.log());
bot.start((ctx: any) => {
  ctx.scene.enter('test');
});
bot.launch();

// Enable graceful stop
// ctrl + c event:
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
