import { Schema, model } from 'mongoose';
import type { Document } from 'mongoose';

export enum AdvertisementSource {
  Olx = 'Olx',
  Otodom = 'Otodom',
}

export interface IAdvertisement {
  title: string;
  link: string;
  area?: string;
  address: string;
  price: string;
  source: AdvertisementSource;
};

export interface IAdvertisementDocument extends IAdvertisement, Document {
  createdAt: Date;
  updatedAt: Date;
};

const advertisementSchema = new Schema<IAdvertisementDocument>({
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  area: Number,
  address: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: AdvertisementSource,
    required: true,
  },
}, { timestamps: true });

export const Advertisement = model<IAdvertisementDocument>('Advertisement', advertisementSchema);
