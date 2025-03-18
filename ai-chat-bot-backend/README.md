# AI Chat Bot Backend

A Node.js backend server for the AI Chat Bot application, using Express and OpenAI.

## Features

- Express server with TypeScript
- OpenAI integration for AI chat capabilities
- CORS configuration for secure frontend communication
- Environment variable configuration

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/ai-chat-bot-backend.git
cd ai-chat-bot-backend
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
ALLOWED_ORIGIN=http://localhost:3000
```

4. Start the development server
```
npm run dev
```

5. For production, build and start the server
```
npm run build
npm start
```

## API Endpoints

### POST /api/chat
Send a message to the AI and get a response.

**Request Body:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "message": "I'm doing well, thank you for asking! How can I assist you today?"
}
```

### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Environment Variables

- `PORT`: The port on which the server will run (default: 5000)
- `OPENAI_API_KEY`: Your OpenAI API key
- `ALLOWED_ORIGIN`: The origin allowed to access the API (default: http://localhost:3000)

## License

MIT 