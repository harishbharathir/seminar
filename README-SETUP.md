# Separated Server and Client Setup

## Development Setup

The application now runs with separated server and client on different ports:

- **Client (Frontend)**: http://localhost:3000
- **Server (Backend)**: http://localhost:3001

## Running the Application

### Option 1: Run Both Together (Recommended)
```bash
npm run dev
```
This starts both server and client simultaneously.

### Option 2: Run Separately
```bash
# Terminal 1 - Start the server
npm run dev:server

# Terminal 2 - Start the client
npm run dev:client
```

## Configuration

Environment variables in `.env`:
- `SERVER_PORT=3001` - Backend server port
- `CLIENT_PORT=3000` - Frontend client port
- `CLIENT_URL=http://localhost:3000` - Client URL for CORS
- `SERVER_URL=http://localhost:3001` - Server URL for API calls

## How It Works

1. **Client (Vite)** runs on port 3000 with proxy configuration
2. **Server (Express)** runs on port 3001
3. API calls from client are proxied to server via Vite's proxy
4. Socket.IO connections are also proxied
5. CORS is configured to allow client-server communication

## Installation

First install the new dependency:
```bash
npm install concurrently --save-dev
```

Then run the development setup:
```bash
npm run dev
```