# WARNING: Documentation may be outdated from parent repo

Builds a container containing [Digiprime](https://github.com/norlen/Digiprime)
and [Negotiation Engine](https://github.com/norlen/NegotiationEngine).

It also starts a [MongoDB](https://www.mongodb.com/) server that both
applications use. Authentication is handled by
[Keycloak](https://www.keycloak.org/) which is started as well.

An automated build of the container exists on
[Docker Hub](https://hub.docker.com/r/norlen/digiprime). To use this replace
`digiprime` with `norlen/digiprime:latest` in the commands below.


## Build

Get the source, the submodules **must** be cloned as well for the build to be
valid.

```bash
git clone --recurse-submodules https://github.com/LarsHajdronKolajder/digiprime-container
cd digiprime-container
docker build . -t digiprime     # Build container
```

## Development build

Instructions to start a development build exist here, currently production
builds are not supported. To use the pre-built image replace `digiprime` with
`norlen/digiprime:latest`. If the image has been pulled before run
`docker image rm norlen/digiprime:latest` to clear it.

The most basic way to run is

```bash
docker run -p 3000:3000 \
  --env MAPBOX_TOKEN=<your token> \
  digiprime
```

Runs Digiprime which is avaiable at [`http://localhost:3000`](http://localhost:3000).

To instead run a more complete build with image uploading support, data
persistance, and a custom keycloak admin user run

```bash
docker run -p 3000:3000 \
  --env MAPBOX_TOKEN=<your token> \
  --env CLOUDINARY_CLOUD_NAME=<your info> \
  --env CLOUDINARY_KEY=<your info> \
  --env CLOUDINARY_SECRET=<your info> \
  --env APIKEY=<project_api_key> \
  -v mongodb_data:/data/db \
  digiprime
```
Get in contact with me to get the keys to run a proper version.

This starts the Digiprime server on [`http://localhost:3000`](http://localhost:3000).

### Environment variables

**Required** environment variables:

- `MAPBOX_TOKEN`: [Mapbox](https://www.mapbox.com/) API key.
- `SECRET`: Key to encrypt cookies. Default value is `thisshouldbeabettersecret` so this should be set to another value for the server to be secure. The way it is set up is that it accepts a comma separated list of secrets, where the first one is used to sign new cookies. This allows for rolling updates of secrets, example `new,old`. See [express-session](https://www.npmjs.com/package/express-session) for more information.
- `CLOUDINARY_CLOUD_NAME`: [Cloudinary](https://cloudinary.com/) cloud name.
- `CLOUDINARY_KEY`: [Cloudinary](https://cloudinary.com/) API key.
- `CLOUDINARY_SECRET`: [Cloudinary](https://cloudinary.com/) secret.

Configurable values:

- `BASE_URL`: If the application is served on a subpath, this controls which one, default: `""`.
- `NODE_ENV`: defaults to `development`, can optionally be set to `production` to hide debug information such as stack traces.
- `AUTH_BASE_URL`: default path to the auth server.

For completeness, the other environent variables are shown here but they should
not be changed.

- `DB_URL`: Database URL for Digiprime, can be set to use another database.
- `PORT`: Port to launch Digiprime. However, the image only exposes port `3000` so leave this alone.
- `DATABASE_URL`: Database URL for Negotiation Engine, can be set to use another database.

### Persisting data

To keep data between runs [docker volumes](https://docs.docker.com/storage/volumes/) should be used.

To persist MongoDB mount `/data/db` which is where Mongo stores the data.

## RBAC

Our RBAC system is built on top of an existing RBAC system, which couldn't be modified. This led to the development of our system, featuring a simplified visual frontend. While the frontend was simple, the backend was especially developt to seamlessly integrate with the pre-existing RBAC system, ensuring that the vital controls and checks will work.



### MongoDB

User login credentials will be securely stored in MongoDB. Initially, certain information will only be modifiable through direct database access, such as role and seller.

#### Database information for RBAC:

- `username`: Represents the account holder's username on the website.
- `password`: Encrypted password used for account authentication.
- `role`: Defines the user's role, with options including sel for sellers, dev for developers, and bro for brokers.
- - `sel`: This is the role for accounts that can sell.
  - `dev`: This is just a developer account.
  - `bro`: This is the role of a broker that let you sell for other accounts
- `seller`: Specific to broker accounts, indicating the sellers they are authorized to represent.


![Example](https://github.com/LarsHajdronKolajder/D0020E/blob/dev/README_image/exampledb.png)


## License

Licensed under either of

 * Apache License, Version 2.0
   ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
 * MIT license
   ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be
dual licensed as above, without any additional terms or conditions.
