# AMU Monitoring - Frontend

React frontend application for the AMU Monitoring capstone project.

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── public/          # Static assets
├── src/
│   ├── App.jsx      # Main App component
│   ├── App.css      # App styles
│   ├── main.jsx     # Application entry point
│   └── index.css    # Global styles
├── index.html       # HTML template
├── vite.config.js   # Vite configuration
└── package.json     # Dependencies and scripts
```

## Development

- The dev server is configured to run on port 3000
- API proxy is configured to forward `/api` requests to `http://localhost:8000` (Django backend)
- Hot Module Replacement (HMR) is enabled for fast development

## Notes

- The application is configured to communicate with the Django backend via the proxy
- CORS is handled by the backend (django-cors-headers)

