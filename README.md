# MedVault - Personal Health Data Vault

A personal health data vault that puts you in control of your medical records. Upload documents, manage access requests, and visualize who has access to your data.

> **Note:** This project is in active development. The current version is a functional demo with AI-powered features. Full encryption and real-time sync are coming soon.

## Current Features

- **AI Document Extraction** - Upload PDFs and let Gemini AI extract structured medical data, summaries, and key fields
- **Access Request Management** - Review, approve, or deny data requests from healthcare providers with granular control over which records to share
- **Access Network Visualization** - Interactive graph showing who has access to your data and what they can see
- **AI Chat Assistant** - Ask questions about your uploaded documents using natural language
- **Webhook Integration** - Approval notifications sent to external systems for workflow automation

## Coming Soon

- **Passkey Authentication** - Passwordless login via WebAuthn (Touch ID, Face ID, Windows Hello)
- **End-to-End Encryption** - All data encrypted client-side using libsodium's XSalsa20-Poly1305
- **Multi-Device Support** - Link devices using temporary invite codes that securely transfer keys
- **Real-Time Sync** - Instant synchronization via Socket.IO WebSockets
- **Secure Sharing** - Share specific records with healthcare providers using time-limited share codes

## Tech Stack

### Current Demo

- **Build**: Vite
- **UI**: React 19 + Tailwind CSS
- **AI**: @google/genai (Gemini 3 Flash)
- **Visualization**: @xyflow/react
- **Language**: TypeScript

### Coming with Full Release

- **Runtime**: Bun
- **Framework**: Next.js 16 (App Router)
- **Real-time**: Socket.IO
- **Crypto**: libsodium-wrappers-sumo
- **Auth**: @simplewebauthn/browser
- **Storage**: IndexedDB (client) + JSON files (server)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Environment Variables

Create a `.env` file with:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

The app will be available at http://localhost:3000

## Project Structure

```
medvault/
├── components/
│   ├── AccessNetworkFlow.tsx   # Interactive access graph
│   ├── AccessRequestsPanel.tsx # Request approval UI
│   ├── ChatAssistant.tsx       # AI chat interface
│   ├── DemoView.tsx            # Main demo dashboard
│   ├── DocumentModal.tsx       # Document viewer
│   ├── EdgeConfigModal.tsx     # Access edge configuration
│   ├── HeroDiagram.tsx         # Landing page diagram
│   └── Icons.tsx               # Icon components
├── services/
│   ├── geminiService.ts        # Gemini AI integration
│   ├── pageContentService.ts   # Page content extraction
│   └── webhookService.ts       # Approval webhook sender
├── App.tsx                     # Main app with landing page
├── types.ts                    # TypeScript types
├── index.tsx                   # App entry point
└── vite.config.ts              # Vite configuration
```

## Architecture (Coming Soon)

### Security Model

The full release will implement a zero-knowledge architecture:

- **Entity Keys** - Each entity has a keypair; the private key never leaves the client unencrypted
- **Device Keys** - Entity keys are wrapped with device-specific keys stored in IndexedDB
- **Invite/Share Codes** - Short-lived codes sealed with PBKDF2 to securely transfer keys
- **Event Encryption** - Every event payload is encrypted with the entity's content key (derived via HKDF)

### Data Flow

1. **Login** → Passkey authenticates user → Entity key loaded from IndexedDB
2. **Upload Document** → Gemini AI extracts data → Encrypt → Store via Socket.IO
3. **Link Device** → Generate invite code → Seal private key → New device decrypts
4. **Share Record** → Generate share code → Seal entity key → Recipient decrypts shared events

## Security Considerations

- Gemini API calls send document content to Google - ensure HIPAA/GDPR compliance for production use
- The current demo stores data in-memory only (no persistence)
- Full encryption will be available in the upcoming release

## License

MIT

## Credits

Built at Tech Sovereignty Hackathon 2026.
