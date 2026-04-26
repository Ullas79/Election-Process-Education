# 🗳️ ElectEd — Election Process Education Assistant

An AI-powered interactive assistant that helps users understand the Indian election process, timelines, and steps in an engaging and accessible way.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📋 Chosen Vertical

**Election Process Education** — A smart, dynamic assistant that educates citizens about the Indian democratic election process through interactive content, AI-powered Q&A, and gamified quizzes.

---

## 🧠 Approach & Logic

### Problem Statement
Many citizens, especially first-time voters, find the election process complex and confusing. There's a need for an accessible, interactive tool that explains the election process step-by-step in simple language.

### Solution Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Timeline │ │  Voter   │ │   AI Chat        │ │
│  │ Explorer │ │  Guide   │ │  (Gemini API)    │ │
│  ├──────────┤ ├──────────┤ ├──────────────────┤ │
│  │ Election │ │ Quiz     │ │  Accessibility   │ │
│  │ Types    │ │ Engine   │ │  Layer           │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │ REST API
┌────────────────────┴────────────────────────────┐
│                   Backend                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Express  │ │ Security │ │  Gemini AI       │ │
│  │ Server   │ │ Layer    │ │  Service         │ │
│  ├──────────┤ ├──────────┤ ├──────────────────┤ │
│  │ Rate     │ │ Input    │ │  Election        │ │
│  │ Limiter  │ │ Sanitize │ │  Data Store      │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Decision-Making Logic

1. **Context-Aware AI Responses**: The Gemini AI assistant maintains conversation history to provide contextual follow-up answers
2. **Fallback Intelligence**: When the AI service is unavailable, the system uses a keyword-matching knowledge base to still provide quality responses
3. **Progressive Disclosure**: Complex election information is organized in expandable sections, preventing cognitive overload
4. **Adaptive Quiz System**: Questions can be filtered by category and difficulty, adapting to the user's knowledge level
5. **Non-Partisan Design**: The entire system is designed to be strictly educational and non-partisan, encouraging informed voting without any political bias

---

## 🚀 How the Solution Works

### Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Assistant** | Google Gemini-powered chatbot that answers election questions in real-time |
| 📅 **Interactive Timeline** | Visual step-by-step timeline of the entire election process |
| 📝 **Voter Guide** | Complete guide for registration, polling day procedures, and required documents |
| 🏛️ **Election Types** | Detailed cards explaining General, State, Local, Rajya Sabha, and Presidential elections |
| 🧠 **Knowledge Quiz** | Interactive quiz with scoring, explanations, and gamification |
| 💡 **Fact Ticker** | Scrolling facts about Indian democracy |
| 🌙 **Dark/Light Mode** | Theme switching with system preference detection |
| ♿ **Full Accessibility** | WCAG 2.1 AA compliant with keyboard navigation and screen reader support |

### Google Services Integration

| Google Service | Usage |
|----------------|-------|
| **Google Cloud Vertex AI (Gemini 3.0 Flash)** | Powers the intelligent Q&A chatbot with election domain expertise using GCP deployment |
| **Google Translate** | Meaningful integration providing real-time multilingual accessibility across the platform for diverse Indian demographics |
| **Google Maps Embed API** | Provides direct visual location mapping to the Election Commission of India |
| **YouTube API** | Meaningful educational video integration for demonstrating "How to Vote using EVM-VVPAT" |
| **Google Fonts (Inter)** | Premium typography using Inter font family for readability |
| **Google Cloud Run** | Docker-ready for deployment on Cloud Run |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a question to the AI assistant |
| `GET` | `/api/chat/status` | Check AI service availability |
| `GET` | `/api/quiz` | Fetch quiz questions (filterable) |
| `POST` | `/api/quiz/check` | Submit quiz answers for grading |
| `GET` | `/api/quiz/categories` | Get quiz categories and counts |
| `GET` | `/api/election/timeline` | Get election process timeline |
| `GET` | `/api/election/voter-guide` | Get voter registration guide |
| `GET` | `/api/election/types` | Get election type information |
| `GET` | `/api/election/facts` | Get random election facts |
| `GET` | `/api/health` | Health check endpoint |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **AI**: Google Cloud Vertex AI (Gemini 3.0 Flash)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES Modules)
- **Security**: Helmet, CORS, express-rate-limit, HPP, input sanitization
- **Logging**: Winston (structured logging with file rotation)
- **Testing**: Jest + Supertest
- **Containerization**: Docker

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- Google Cloud Project with Vertex AI API enabled
- GCP Service Account credentials or Application Default Credentials configured

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Election-Process-Education.git
cd Election-Process-Education

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GCP_PROJECT_ID and GCP_LOCATION

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The app works without a GCP configuration too! The chat will use a built-in knowledge base instead of AI-generated responses.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Docker

```bash
# Build and run with Docker
docker build -t elected .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key elected
```

---

## 📁 Project Structure

```
Election-Process-Education/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server entry point
│   │   ├── routes/
│   │   │   ├── chat.js            # AI chat endpoints
│   │   │   ├── quiz.js            # Quiz endpoints
│   │   │   └── election.js        # Election data endpoints
│   │   ├── services/
│   │   │   └── geminiService.js   # Google Gemini AI integration
│   │   ├── middleware/
│   │   │   ├── security.js        # Helmet, HPP, XSS sanitization
│   │   │   └── rateLimiter.js     # Rate limiting configuration
│   │   ├── data/
│   │   │   └── electionData.js    # Election content database
│   │   └── utils/
│   │       └── logger.js          # Winston logger configuration
│   └── tests/
│       ├── chat.test.js           # Chat API tests
│       ├── quiz.test.js           # Quiz API tests
│       └── election.test.js       # Election data tests
├── frontend/
│   ├── index.html                 # Single-page application
│   ├── css/
│   │   ├── styles.css             # Design system & components
│   │   └── animations.css         # Animations & micro-interactions
│   └── js/
│       ├── app.js                 # Main app (theme, nav, data loading)
│       ├── timeline.js            # Interactive timeline module
│       ├── chat.js                # AI chat module
│       ├── quiz.js                # Quiz engine module
│       └── accessibility.js       # Accessibility enhancements
├── package.json
├── Dockerfile
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔒 Security Measures

| Feature | Implementation |
|---------|---------------|
| **Security Headers** | Helmet.js with strict CSP, CORS, referrer policy |
| **Rate Limiting** | API: 100 req/15min, Chat: 10 req/min |
| **Input Sanitization** | XSS prevention, HTML stripping, length limits |
| **Parameter Pollution** | HPP middleware prevents HTTP parameter pollution |
| **Request Size Limits** | 10KB body limit prevents payload abuse |
| **Content Safety** | Gemini safety settings block harmful content |
| **Non-root Docker** | Container runs as non-root user |

---

## ♿ Accessibility Features

- **Skip Navigation**: Skip-to-content link for keyboard users
- **ARIA Labels**: All interactive elements have descriptive ARIA attributes
- **Keyboard Navigation**: Full keyboard support with arrow key navigation
- **Screen Reader**: ARIA live regions for dynamic content updates
- **Reduced Motion**: Respects `prefers-reduced-motion` system setting
- **High Contrast**: Support for `prefers-contrast: high` media query
- **Semantic HTML**: Proper heading hierarchy, landmarks, and roles
- **Focus Management**: Visible focus indicators with custom styling
- **Color Contrast**: All text meets WCAG 2.1 AA contrast requirements

---

## 🧪 Testing

The test suite covers:
- **Chat API**: Input validation, sanitization, conversation history, error handling
- **Quiz API**: Question filtering, answer checking, scoring, edge cases
- **Election Data API**: Timeline, voter guide, election types, facts
- **Health Check**: Server status verification

---

## 📝 Assumptions

1. **Indian Elections Focus**: The content is focused on the Indian electoral system (ECI, Lok Sabha, EVMs, etc.)
2. **Gemini API Optional**: The app functions fully without a Gemini API key using a built-in knowledge base
3. **Single-Page App**: The frontend is a single-page application served by the Express backend
4. **Educational Purpose**: All content is strictly educational and non-partisan
5. **Modern Browsers**: The frontend targets modern browsers with ES Module support

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for Indian Democracy**

🗳️ *Every vote counts. Be informed. Be responsible.*

</div>
