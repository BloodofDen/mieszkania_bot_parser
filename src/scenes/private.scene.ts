import type { Message } from 'typegram';
import { Markup, Scenes, MiddlewareFn } from 'telegraf';
import type { IState } from '../models';
import { Scene, BlitzResponse } from './models';
import { wizardSceneFactory } from './utils';
import { SCENE_TO_VALIDATOR_MAPPER, SCENE_TO_TEXT_MAPPER } from './constants';

const TEXT = SCENE_TO_TEXT_MAPPER[Scene.Private];
const VALIDATOR = SCENE_TO_VALIDATOR_MAPPER[Scene.Private];

const sceneSteps: MiddlewareFn<Scenes.WizardContext>[] = [
  async (ctx) => {
    const { command } = ctx.wizard.state as IState;

    await ctx.replyWithHTML(
      TEXT[command].SHOULD_BE_PRIVATE!,
      Markup.keyboard(Object.keys(BlitzResponse)).oneTime().resize(),
    );

    return ctx.wizard.next();
  },
  async (ctx, done) => {
    const { criteria } = ctx.wizard.state as IState;
    const message = ctx.message as Message.TextMessage;
    const blitzResponse = message.text as BlitzResponse;

    if (!Object.values(BlitzResponse).includes(blitzResponse)) {
      return ctx.replyWithHTML(VALIDATOR.ERROR_MESSAGE.WRONG_VALUE);
    }

    criteria.isPrivate = blitzResponse === BlitzResponse.Yes;
    return done();
  },
];

export const createPrivateScene = wizardSceneFactory(
  Scene.Private,
  ...sceneSteps
);
