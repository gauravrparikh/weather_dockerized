# ece5901hw2 - Gaurav Rajesh Parikh
# Weather Web App with Node.js, Redis, and Docker

A web application that fetches weather data from an external API, caches responses with Redis, and runs in a Dockerized environment.

## Features

- Fetches weather data from Weather API using ZIP code.
- Caches favourited locations using Redis. 
- Dockerized for easy setup and deployment

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- API key from the weather service provider. 

## Getting Started

1. Clone the repository

2. Create a `.env` file in the root directory with the following environment variables:

```bash
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
WEATHER_API_KEY= # Your API key here
```
3. Build and run the application using Docker Compose:

```bash
docker compose up --build
```
