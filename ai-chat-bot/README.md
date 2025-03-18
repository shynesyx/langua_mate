# AI Chat Bot

A React-based AI chat bot application with a modern UI.

## Features

- Clean, modern UI with styled-components
- Responsive design that works on desktop and mobile
- Mock AI responses for development
- Easy to integrate with real AI APIs

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/ai-chat-bot.git
cd ai-chat-bot
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Connecting to a Real AI API

By default, the application uses mock responses in development mode. To connect to a real AI API:

1. Create a `.env` file in the root directory
2. Add your API URL:
```
REACT_APP_API_URL=https://your-api-url.com
```

3. Update the API service in `src/services/api.ts` if needed to match your API's request/response format

## Project Structure

- `src/components/` - React components
- `src/services/` - API and other services
- `src/types.ts` - TypeScript type definitions

## Customization

- Change the styling by modifying the styled-components in each component file
- Add new mock responses in `src/services/api.ts`
- Extend the MessageType in `src/types.ts` to include additional properties

## License

MIT 