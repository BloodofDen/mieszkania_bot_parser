import type { User as ITelegramUser } from 'typegram';
import { Scenes, Markup, MiddlewareFn } from 'telegraf';
import type { IState, IUser, ICriteria } from '../models';
import { Scene, BlitzResponse, ISceneText } from './models';

const unwrapCallback = async (
  ctx: Scenes.WizardContext,
  getNextScene: (ctx: Scenes.WizardContext) => Scene | Promise<Scene | void>,
): Promise<void> => {
  const nextSceneId = await Promise.resolve<Scene | void>(getNextScene(ctx));

  if (nextSceneId) {
    ctx.scene.enter(nextSceneId, ctx.scene.state);
  } else {
    ctx.scene.leave();
  }
};

/**
 * Takes steps as arguments and returns a sceneFactory
 *
 * Additionally does the following things:
 * 1. Makes sure next step only triggers on `message` or `callbackQuery`
 * 2. Passes second argument - doneCallback to each step to be called when scene is finished
 */
export const wizardSceneFactory = (
  sceneType: Scene,
  ...advancedSteps: MiddlewareFn<Scenes.WizardContext>[]
) => {
  /**
   * Branching extension enabled sceneFactory
   * @param sceneType {string}
   * @param getNextScene {function} - async func that returns nextSceneType
   */
  return function createWizardScene(
    getNextScene: (ctx: Scenes.WizardContext) => Scene | Promise<Scene | void>,
  ) {
    return new Scenes.WizardScene(
      sceneType,
      ...advancedSteps.map(
        (stepFn: MiddlewareFn<Scenes.WizardContext>) =>
          async (ctx: Scenes.WizardContext) => {
            /** ignore user action if it is neither message, nor callbackQuery */
            if (!ctx.message && !ctx.callbackQuery) {
              return;
            }

            return stepFn(ctx, () => unwrapCallback(ctx, getNextScene));
          },
      ),
    );
  }
};

export const getFirstSceneInlineQuestion = (
  TEXT: ISceneText,
): MiddlewareFn<Scenes.WizardContext> =>
  async (ctx) => {
    const { command } = ctx.wizard.state as IState;

    await ctx.replyWithHTML(
      TEXT[command].INLINE_QUESTION!,
      Markup.inlineKeyboard([
        Markup.button.callback('✅Yes', BlitzResponse.Yes),
        Markup.button.callback('❌No', BlitzResponse.No),
      ]),
    );

    return ctx.wizard.next();
  };

export const mapTelegramUserToUser = (
  telegramUser: ITelegramUser,
  criteria: ICriteria,
): IUser => {
  const newUser: IUser = {
    telegramId: telegramUser.id,
    isBot: telegramUser.is_bot,
    firstName: telegramUser.first_name,
    lastName: telegramUser.last_name,
    nickname: telegramUser.username,
    languageCode: telegramUser.language_code,
    criteria: { ...criteria },
  };

  return newUser;
};
