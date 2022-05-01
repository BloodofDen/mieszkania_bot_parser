import axios from 'axios';
import cheerio from 'cheerio';
import { ICriteria, IAdvertisement, AdvertisementSource } from '../models';
import { RoomsNumber } from '../scenes/models';
import { BaseParser } from './BaseParser';

export class OlxParser extends BaseParser {
  constructor(criteria: ICriteria, maxAdsLimit: number) {
    super(
      criteria,
      maxAdsLimit,
      'https://www.olx.pl',
      'nieruchomosci/mieszkania/wynajem/',
    );

    this.url.search = this.composeSearchParams();
  }

  protected composeSearchParams(): string {
    const urlSearchParams = new URLSearchParams({
      ...(this.criteria.roomsNumber && {
        'search[filter_enum_rooms][0]': RoomsNumber[this.criteria.roomsNumber]!.toLowerCase(),
      }),
      ...(this.criteria.areaMin && {
        'search[filter_float_m:from]': this.criteria.areaMin.toString(),
      }),
      ...(this.criteria.areaMax && {
        'search[filter_float_m:to]': this.criteria.areaMax.toString(),
      }),
      ...(this.criteria.priceMin && {
        'search[filter_float_price:from]': this.criteria.priceMin.toString(),
      }),
      ...(this.criteria.priceMax && {
        'search[filter_float_price:to]': this.criteria.priceMax.toString(),
      }),
      ...(this.criteria.isPrivate && {
        'search[private_business]': 'private',
      }),
    });

    return urlSearchParams.toString();
  }

  async parse(): Promise<IAdvertisement[]> {
    const { data } = await axios.get(this.url.toString());
    const $ = cheerio.load(data);
    const ads = $(`#offers_table .offer table`)
      .map((_, table) => {
        const a = $(table).find('.title-cell a');
        const title = a.text().trim();
        const link = a.attr('href');

        const p = $(table).find('.price');
        const price = p.text().trim();

        const span = $(table).find('.bottom-cell span').first();
        const address = span.text().trim();

        return {
          title,
          link,
          address,
          price,
          source: AdvertisementSource.Olx,
        } as IAdvertisement;
      })
      .toArray()
      .filter((ad, i, ads) => ads.indexOf(ad) === i)
      .slice(0, this.maxAdsLimit);

    return ads;
  };
};
