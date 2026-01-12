# WCAG Simple

A simple, stand-alone web application for scanning web pages for WCAG 2.1 Level AA accessibility violations.

## Features

- 🔍 Scan public web pages for accessibility issues
- 🔐 Support for scanning pages behind authentication
- 📊 Clear, actionable HTML reports
- ♿ WCAG 2.1 Level AA compliance checking
- 📱 Responsive design for mobile and desktop
- 🎯 Simple, accessible user interface

## Tech Stack

- **Framework**: Next.js 15 (static site)
- **Language**: TypeScript
- **Accessibility Engine**: Axe-Core
- **Browser Automation**: Playwright
- **Crawler**: Crawlee
- **Testing**: Vitest, Playwright
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

### Build

```bash
# Build for production (static export)
npm run build

# The output will be in the `out` directory
```

### Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e
```

## Usage

1. Enter a URL to scan
2. (Optional) Add authentication credentials for protected pages
3. Click "Scan for Accessibility Issues"
4. View the summary and detailed report
5. Download the full HTML report

## Constitution Compliance

This project follows the WCAGSimple Constitution:

- ✅ Accessibility-First (WCAG 2.1 AA)
- ✅ Test-First (TDD)
- ✅ Simplicity & MVP Focus
- ✅ Dependency Security
- ✅ Code Clarity (PascalCase/camelCase)
- ✅ UX Guidelines (Simple & Clear)
- ✅ Observability (Structured Logging)

## License

MIT
