# App2Rack Backend

Enterprise-grade Express.js backend for the App2Rack monitoring platform.

## Architecture

The backend follows a modular architecture:
- **src/config**: Environment variables and app configurations.
- **src/controllers**: Request handling and response formatting.
- **src/routes**: API endpoint definitions.
- **src/middleware**: Reusable logic for requests (auth, logging, error handling).
- **src/services**: Business logic and database interactions.
- **src/models**: Data structures and types.
- **src/utils**: Reusable helper functions.
- **src/validators**: Input validation logic using `express-validator`.
- **src/database**: Database connection and migration logic.
- **src/constants**: Application-wide constants.

## Tech Stack
- **Express.js**: Web framework.
- **PostgreSQL**: Relational database.
- **pg**: PostgreSQL client for Node.js.
- **jsonwebtoken**: JWT-based authentication.
- **bcrypt**: Password hashing.
- **express-validator**: Input validation.
- **helmet**: Security headers.
- **morgan**: HTTP request logging.

## Getting Started

1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your details.
4. `npm run dev`
