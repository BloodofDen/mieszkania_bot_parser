import type { Message } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import { Scene, BlitzResponse, IWizardState } from '../models';
import { wizardSceneFactory } from './utils';

const TEXT = {
  SHOULD_BE_PRIVATE: `Is advertisement should be <b>${Scene.Private}</b>?`,
};

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  async (ctx) => {
    await ctx.replyWithHTML(
      TEXT.SHOULD_BE_PRIVATE,
      Markup.keyboard(Object.keys(BlitzResponse)).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const state = ctx.wizard.state as IWizardState;
    const message = ctx.message as Message.TextMessage;
    const blitzResponse = message.text as BlitzResponse;

    if (!Object.keys(BlitzResponse).includes(blitzResponse)) {
      return;
    }

    state.criteria.isPrivate = blitzResponse === BlitzResponse.Yes;
    return done();
  },
];

export const createPrivateScene = wizardSceneFactory(
  Scene.Private,
  ...sceneSteps
);
