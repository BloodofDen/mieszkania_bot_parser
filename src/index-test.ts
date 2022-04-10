import * as dotenv from 'dotenv';
import { ICriteria, RoomsNumber } from './models';
import { Parser } from './parsers';

dotenv.config();

(async() => {
  const parser = new Parser({
    roomsNumber: RoomsNumber.Two,
    priceMin: 1900,
    priceMax: 4000,
    areaMin: 40,
    province: 'Mazowieckie',
    city: 'Warszawa',
    isPrivate: true,
  } as ICriteria);

  const results = await parser.otodom.parse();
  console.log(results);
})();
