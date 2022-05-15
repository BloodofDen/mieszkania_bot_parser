import type { Message } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, BlitzResponse } from './models';
import { wizardSceneFactory } from './utils';
import { VALIDATOR } from './constants';

const { ERROR_MESSAGE } = VALIDATOR[Scene.Private];

const TEXT = {
  SHOULD_BE_PRIVATE: `Should advertisements be <b>${Scene.Private}</b>?`,
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
    const { criteria } = ctx.wizard.state as IState;
    const message = ctx.message as Message.TextMessage;
    const blitzResponse = message.text as BlitzResponse;

    if (!Object.values(BlitzResponse).includes(blitzResponse)) {
      return ctx.replyWithHTML(ERROR_MESSAGE);
    }

    criteria.isPrivate = blitzResponse === BlitzResponse.Yes;
    return done();
  },
];

export const createPrivateScene = wizardSceneFactory(
  Scene.Private,
  ...sceneSteps
);
