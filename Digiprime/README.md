[Digiprime](https://www.digiprime.eu/) is an EU project for the circular economy. This project is part of it and acts as a offer directory, with the ability to create auctions from these offers and negotiate the price on them.

This work is an addition to the work contained in [Digiprime](https://github.com/ShaiFernandez/Digiprime). Our main additions are auctions, negotations, contract selection, and messages. These new additions use the [Negotation Engine](https://github.com/norlen/NegotiationEngine) API to handle the negotiation aspect and contract signing.

## Getting started

### Ready-to-use container

There exists a ready to use build of [Digiprime](https://hub.docker.com/r/norlen/digiprime) on Docker Hub that contains all the required projects and dependencies. See the readme there for how to use it.

To instead build it from source, see [digiprime-container](https://github.com/norlen/digiprime-container).

### Pre-requisites

This project cannot be run entirely by itself. Required dependencies include

- [MongoDB](https://www.mongodb.com/) must be available.
- [Keycloak](https://www.keycloak.org/) must be available.
- [Negotiation Engine](https://github.com/norlen/NegotiationEngine) must be running on the system.

### Setup

To start using the project get the source and install all project dependencies

```bash
git clone https://github.com/norlen/Digiprime
cd Digiprime
npm install             # install node deps
```

Before it can run some additional configuration is required. All values can be seen in the `.env.example` file which can be used as a starting point.

Environment variables with defaults are

- `DB_URL`: URL to the mongodb database where all data should be stored, default: `mongodb://localhost:27017/offer-test`.
- `SECRET`: Secret key to encrypt the cookies. Allows for a list of values `first,second,...` to rotate the secrets, the first one will be used to encrypt the cookie. Default: `thisshouldbeabettersecret`.
- `PORT`: Port to start the server, default: `3000`.
- `NEGOTIATION_ENGINE_BASE_URL`: Base URL to Negotiation Engine, default: `http://localhost:5000`.
- `USE_TLS`: If TLS is enabled, this should be `true` to enable secure cookies, default: `false`.

And the other environment variables have no defaults and are **required**

- `KEYCLOAK_REALM`: Keycloak realm to use.
- `KEYCLOAK_CLIENT_ID`: Keycloak realm client to use.
- `KEYCLOAK_CLIENT_SECRET`: Keycloak realm client secret.
- `KEYCLOAK_AUTH_SERVER_URL`: Keycloak server URL.
- `KEYCLOAK_CALLBACK_URL`: Keycloak login callback handler, is available as `/auth/callback`.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_HOST_URL`: Secrets required for image uploading, see [Cloudinary](https://cloudinary.com/) for more information.
- `MAPBOX_TOKEN`: API key from [Mapbox](https://www.mapbox.com/).

Debug stack traces become disabled if `NODE_ENV` is not set to `development`.

### Development

To run in development complete the setup and run

```bash
npm run dev
```

### Production

When running in production, set up a reverse proxy with HTTPS and point it to the the app server, then run using

```bash
NODE_ENV="production" USE_TLS="true" npm run start
```

### Seeding

To seed 100 offers with varying sectors, types, and prices. Run

```bash
npm run seed
```

Note that this removes all previously created offers, which will break the website if auctions or negotiations have been created.


## Additions

This project is based off [Digiprime](https://github.com/ShaiFernandez/Digiprime). The main additions we have done are auctions, negotations, messages, and miscellaneous changes around the whole project.

The project uses the model-view-controller (MVC) pattern so for most of our additions, we have added functionality in all those areas. In addition, handling the routing and making everything work as a whole. The project also has a focus on security, so all our additions perform input validation and sanitization to prevent e.g. XSS attacks.

We also improved security slightly with support for secure cookies in the case the project is served over HTTPS, and in our containerization we added a reverse-proxy infront to serve over HTTPS.

### Auctions

For each auctions we have two main kinds. 

- Single offer auction: the creator of the auction also owns the offer. This allows the user to e.g. buy a product they want from the lowest bidder, or sell their product to the highest bidder. These can either be public or private, and if they are private the creator must choose the participants when creating the auction.
- Multiple offer auction: the creator select multiple non-owned offers. So they the suppliers can bid between themselves to sell their product for the lowest price, or demanders bid the highest price to buy something.

The main auction functionality can be found under `/auctions`. This allows for listing all active auctions, listing all historical auctions, listing public auctions, and showing specific auctions. For specific auctions we support bidding, joining if the auction is public, selecting the eventual winner, and an in-depth display of the bids.

Creating an auction has been added to either the offer page, for offers you have created (single offer auctions). The user can also create an auction from the offer directory page, where they can select the offers they want to include in an auction (multiple offer auctions).

### Negotations

Negotiations are peer-to-peer negotiations between two different parties. They allow a user to invite another user, for an offer they are interested in, to negotiate on the price.

Negotations can be found at `/negotations` which lists all the negotations the user is part of. For specific negotations the user's bid back and forth, and after a user receives an offer they can either counter bid, accept the negotation, or entirely reject the negotation. The two latter choices ends the negotation altogheter. When a negotiation has been accepted, a new page is displayed which shows the final contract details.

### Profiles

To provide users the ability to see who they are buying from or selling to we added user profiles. This allows every user to create their own profile which contain their contact details, what they do, and if they are a company or an individual.

Every user has their own profile located at `/profile/<username>`. Users can also edit their profiles, and links to the profiles have been added where usernames are displayed.

### Messages

To allow the communication between users to stay on the platform, we have added support for messaging. This allows participants in either auctions or negotiations to contact the creator to further discuss details before comitting to a bid. However, it is not limited to this, and messages can be sent to anyone at any time.

The messaging system supports conversations so the thread of messages are easy to follow. Every user has their own mailbox where they can view all conversations, unread conversations, read conversations, or marked conversations. Every conversation can be marked for the ability to keep track of them more easily.

When viewing a message they are automatically marked as read.

### Misc

By default, all pages in the original Digiprime platform displayed all data. For all of our additions, support for pagination has been added. This has been extended to the different offer pages as well.

The offer directory, which displays and allows for filtering of offers, did the filtering client-side. With our support for pagination we had to move this server-side. While the response time for the filtering will be slower, it allows for more advanced filtering and searching.

## Further work

One major part missing from our additions is the ability for a user to act as a broker in the system. Havint the ability to act on other companies behalf when using the platform. Due to time contraints we felt this addition could not be implemented in a satisfactory way before the end of the project.

With our added support for server side filtering of offers, we have laid the groundwork to implement the elastic search parameters for further filtering of offers. However, we did not have time to implement these advanced search features.

Further additions in security can also be added, such as CSRF protection, we have laid the groundwork for this to work. However, due to not being familiar with all the libraries used, especially in image upload handling, we did not have time to implement it fully, so it is currently disabled.
