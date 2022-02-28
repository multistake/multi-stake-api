# stake my SOL API

An API, providing endpoints for fetching data of Solana validators and searching in validators.

# Documentation

To be added very soon.

# Requirements

Create an `.env` file in root directory of the project. Inside the file create variables below:

```text
PORT=<port you want the server to run on.>
MONGO_CONNECT_URI=<mongodb-connection-string>
VALIDATORS_APP_TOKEN:<token from validators.app API>
```

API uses MongoDB. To store downloaded and processed data from validators a mongoDB database is needed. At the time of writing this, It's free to create a basic Cluster in [Mongo DB Atlas](https://www.mongodb.com/atlas/database).

To use the created Database follow instructions provided by MongoDB atlas for connecting with a Node.js Application. Copy the connection string, and provide it as an environmental variable by putting it the `.env` file created.

API fetches part of the validators data from [validators.app](https://validators.app/) API. Create an account and get a token and put it in `.env` file.

# Run locally

To install dependencies:

```shell
npm install
```

To build:

```shell
npm run build
```

To run the server in development mode:

```shell
npm run start:dev
```

To run the server in production mode:

```shell
npm start
```

# Disclaimer

All claims, content, designs, algorithms, estimates, roadmaps, specifications, and performance measurements described in this project are done with "Stake my SOL" team's good faith efforts. It is up to the reader to check and validate their accuracy and truthfulness. Furthermore, nothing in this project constitutes a solicitation for investment.
