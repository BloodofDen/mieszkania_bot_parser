import axios from 'axios';
import cheerio from 'cheerio';
import { IAdvertisement, ICriteria, AdvertisementSource, RoomsNumber } from '../models';
import { BaseParser } from './BaseParser';

export class OtodomParser extends BaseParser {
  readonly #baseSearchParams: Record<string, string> = {
    distanceRadius: '0',
    page: '1',
    limit: '36',
    market: 'ALL',
    viewType: 'listing',
  };

  constructor(criteria: ICriteria) {
    super(
      criteria,
      'https://www.otodom.pl',
      'pl/oferty/wynajem/mieszkanie/',
    );

    this.url.search = this.composeSearchParams();
  }

  protected composeSearchParams(): string {
    const urlSearchParams = new URLSearchParams({
      ...this.#baseSearchParams,
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
        const articleDivs = article.find('div');
        const articlePs = article.find('p')

        const title = articleDivs.first().find('h3').text().trim();
        const link = this.url.origin + a.attr('href');
        const area = articleDivs.eq(1).find('p').last().find('span').last().text().trim();
        const address = articlePs.first().text().trim();
        const price = articleDivs.eq(1).find('p').first().text().trim();

        return {
          title,
          link,
          area,
          address,
          price,
          source: AdvertisementSource.Otodom,
        } as IAdvertisement;
      })
      .toArray();

    return ads;
  };
};
