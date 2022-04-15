import axios from 'axios';
import cheerio from 'cheerio';
import { ICriteria, IAdvertisement, AdvertisementSource } from '../models';
import { RoomsNumber } from '../scenes/models';
import { BaseParser } from './BaseParser';

export class OtodomParser extends BaseParser {
  readonly #baseSearchParams: Record<string, string> = {
    distanceRadius: '0',
    page: '1',
    market: 'ALL',
    viewType: 'listing',
  };

  constructor(criteria: ICriteria, maxAdsLimit: number) {
    super(
      criteria,
      maxAdsLimit,
      'https://www.otodom.pl',
      'pl/oferty/wynajem/mieszkanie/',
    );

    this.url.search = this.composeSearchParams();
  }

  protected composeSearchParams(): string {
    const urlSearchParams = new URLSearchParams({
      ...this.#baseSearchParams,
      limit: this.maxAdsLimit.toString(),
      ...(this.criteria.roomsNumber && {
        roomsNumber: `[${RoomsNumber[this.criteria.roomsNumber]!.toUpperCase()}]`,
      }),
      ...(this.criteria.areaMin && {
        areaMin: this.criteria.areaMin.toString(),
      }),
      ...(this.criteria.areaMax && {
        areaMax: this.criteria.areaMax.toString(),
      }),
      ...(this.criteria.priceMin && {
        priceMin: this.criteria.priceMin.toString(),
      }),
      ...(this.criteria.priceMax && {
        priceMax: this.criteria.priceMax.toString(),
      }),
      ...(this.criteria.isPrivate && {
        isPrivateOwner: 'true',
      }),
    });

    return urlSearchParams.toString();
  }

  async parse(): Promise<IAdvertisement[]> {
    const { data } = await axios.get(this.url.toString());
    const $ = cheerio.load(data);
    const ads = $(`[data-cy="search.listing"] > ul`)
      .last()
      .children()
      .filter((_i, li) => Boolean($(li).find('a').length))
      .map((_i, li) => {
        const a = $(li).find('a');

        const article = a.find('article');
        const paragraphs = article.find('p');
        const divs = article.find('div');
        const header = divs.eq(0).find('h3');
        const spans = divs.eq(1).find('span');

        const title = header.text().trim();
        const link = this.url.origin + a.attr('href');
        const area = spans.last().text().trim();
        const address = paragraphs.first().text().trim();
        const price = spans.first().text().trim();

        return {
          title,
          link,
          area,
          address,
          price,
          source: AdvertisementSource.Otodom,
        } as IAdvertisement;
      })
      .toArray()
      .slice(0, this.maxAdsLimit);

    return ads;
  };
};
