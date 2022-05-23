import { Schema, model, Document } from 'mongoose';
import type { User as ITelegramUser } from 'typegram';
import { Province, City } from './scenes/models';
import { Parser } from './parsers';
import { Store } from './store';
import { BotCommand } from './commands';

export type StoreCallback = (
  userTelegramId: IUser['telegramId'],
  parser: Parser,
  advertisements: IAdvertisement[],
) => Promise<void>;

export interface IState {
  user: ITelegramUser;
  criteria: ICriteria;
  store: Store;
  command: BotCommand.Start | BotCommand.Update;
};

export enum AdvertisementSource {
  Olx = 'Olx',
  Otodom = 'Otodom',
};

export interface IAdvertisement {
  title: string;
  link: string;
  area?: string;
  address: string;
  price: string;
  source: AdvertisementSource;
};

export interface ICriteria {
  roomsNumber?: number;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  province?: Province;
  city?: City;
  isPrivate: boolean;
};

export interface IUser {
  telegramId: number;
  isBot: boolean;
  firstName: string;
  lastName?: string;
  nickname?: string;
  languageCode?: string;
  criteria: ICriteria;
};

interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
};

const criteriaSchema = new Schema<ICriteria>({
  roomsNumber: Number,
  priceMin: Number,
  priceMax: Number,
  areaMin: Number,
  areaMax: Number,
  province: {
    type: String,
    enum: Province,
  },
  city: {
    type: String,
    enum: City,
  },
  isPrivate: {
    type: Boolean,
    required: true,
  },
}, { _id: false });

const userSchema = new Schema<IUserDocument>({
  telegramId: {
    type: Number,
    unique: true,
    index: true,
    required: true,
  },
  isBot: {
    type: Boolean,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: String,
  nickname: {
    type: String,
    unique: true,
  },
  languageCode: String,
  criteria: criteriaSchema,
}, { timestamps: true })

export const User = model<IUserDocument>('User', userSchema);
