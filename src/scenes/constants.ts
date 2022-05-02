import { Scene, BlitzResponse } from './models';

export const INLINE_ERROR_MESSAGE = `Please choose <b>${BlitzResponse.Yes}</b> or <b>${BlitzResponse.No}</b> using buttons above`;

export const VALIDATOR: Record<Scene, {
  ERROR_MESSAGE: string,
  REG_EXP?: RegExp,
}> = {
  [Scene.Province]: {
    ERROR_MESSAGE: `Please choose value from list`,
  },
  [Scene.City]: {
    ERROR_MESSAGE: `Please choose value from list`,
  },
  [Scene.Area]: {
    ERROR_MESSAGE: `Please specify value from <b>1.00</b> to <b>999.99</b>`,
    REG_EXP: /^[1-9]\d{0,2}(\.\d{1,2})?$/,
  },
  [Scene.RoomsNumber]: {
    ERROR_MESSAGE: `Please specify value from <b>1</b> to <b>4</b>`,
    REG_EXP: /^[1-4]$/,
  },
  [Scene.Price]: {
    ERROR_MESSAGE: `Please specify value from <b>100</b> to <b>99999</b>`,
    REG_EXP: /^[1-9]\d{2,4}$/,
  },
  [Scene.Private]: {
    ERROR_MESSAGE: `Please choose <b>${BlitzResponse.Yes}</b> or <b>${BlitzResponse.No}</b>`,
  },
}

export const LEAVE_BLANK =  'Leave Blank';
