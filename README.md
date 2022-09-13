<div id="top"></div>

<!-- ABOUT THE PROJECT -->
## About mieszkania_bot_parser


This is a [Telegram bot](https://t.me/nowe_mieszkania_bot) that helps to find a rental apartment in Poland according to your parameters!

The reason I decided to develop it - I was looking for an apartment in Warsaw for a weeks but wasn't able to find appropriate. The average TTL(time to live) of the advertisement was 5 mins. If you don't call first - forget about the apartment, it'll be occupied. After the bot was set up I found a good apartment just in a day.

Hope it'll help somebody as it helped to me. Enjoy using it!


## Built with

* [Axios](https://github.com/axios/axios/)
* [Cheerio](https://cheerio.js.org/)
* [Mongoose](https://mongoosejs.com/)
* [Telegraf](https://telegrafjs.org/)


<!-- GETTING STARTED -->
## Installation steps

1. Clone the repo

   ```sh
   $ git clone https://github.com/your_username/mieszkania_bot_parser.git
   ```
2. Install NPM packages

   ```sh
   $ yarn install
   ```
3. Add following environment variables in `.env` file (values - just for instance)

   ```env
   MONGODB_LOGIN=MongoUser
   MONGODB_PASSWORD=MN7nFwmL22YOdl7E
   BOT_TOKEN=270485614:AAHfiqksKZ8WmR2zSjiQ7_v4TMAKdiHm9T0
   DEFAULT_PARSING_FREQUENCY=0.5
   ```

4. Start the project locally

   ```sh
   $ yarn start:dev
   ```


<!-- DEPLOYMENT -->
## Deployment to Heroku

1. Log in to Heroku

   ```sh
   $ heroku login
   ```

2. Create Heroku app

   ```sh
   $ heroku create -a <app name>
   ```

3. Push app to Heroku

   ```sh
   $ git push heroku <branch name>
   ```

#### Useful Links:

- [Getting Started on Heroku with Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs)

- [Deploy Node.js app on Heroku](https://devcenter.heroku.com/articles/deploying-nodejs)


<!-- ROADMAP -->
## Roadmap

- [x] Provide a DB support
- [x] Add Link to current actual working Bot
- [ ] Add 1-2 more sites to parse
- [ ] Add Test Coverage
- [ ] Add Multi-language Support
- [ ] Move from MongoDB to Heroku Postgres



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="center">(<a href="#top">back to top</a>)</p>
