# IOFRA API

Express.js TypeScript backend for the IOFRA platform.

## Features

- RESTful API for IoT device management
- TypeScript for type safety
- Express.js for HTTP server
- Jest for testing
- Clean architecture (controllers, services, models)

## API Endpoints

### Device Management

- `GET /api/devices` - Get all devices
- `GET /api/devices/:id` - Get a specific device by ID
- `POST /api/devices` - Create a new device
- `PUT /api/devices/:id` - Update a device
- `DELETE /api/devices/:id` - Delete a device

### Health Check

- `GET /health` - Check API health status

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.0.0+

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
```

The API will be available at http://localhost:3001.

### Testing

```bash
# Run tests
pnpm test
```

### Building for Production

```bash
# Build for production
pnpm build

# Start the production server
pnpm start
```

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middlewares/     # Middleware functions
├── models/          # Data models and interfaces
├── routes/          # API route definitions
├── services/        # Business logic
├── utils/           # Utility functions
└── server.ts        # Entry point
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
``` 