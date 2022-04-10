import type { User as ITelegramUser } from 'typegram';
import { ICriteria } from './user.model';

export * from './user.model';
export * from './advertisement.model';

export enum Scene {
  Province = 'Province',
  City = 'City',
  Area = 'Area',
  RoomsNumber = 'Number Of Rooms',
  Price = 'Price',
  Private = 'Private',
};

export enum RoomsNumber {
  One = 1, Two, Tree, Four,
}

export enum BlitzResponse {
  Yes = 'Yes',
  No = 'No',
};

export interface IWizardState {
  user: ITelegramUser;
  criteria: ICriteria;
};
