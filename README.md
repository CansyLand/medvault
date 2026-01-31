# MedVault - Personal Health Data Vault

A secure, end-to-end encrypted personal health data vault built with Next.js, Socket.IO, and libsodium. Based on TrueTrace's zero-knowledge architecture with medical-focused features.

## Features

- **Passkey Authentication** - Passwordless login via WebAuthn (Touch ID, Face ID, Windows Hello)
- **End-to-End Encryption** - All data encrypted client-side using libsodium's XSalsa20-Poly1305
- **Multi-Device Support** - Link devices using temporary invite codes that securely transfer keys
- **Real-Time Sync** - Instant synchronization via Socket.IO WebSockets
- **Medical Record Management** - Upload and manage encrypted medical documents
- **AI-Powered Extraction** - Gemini AI extracts structured data from PDFs
- **Secure Sharing** - Share specific records with healthcare providers using share codes
- **Access Network Visualization** - Visual representation of who has access to your data

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + CSS (MedVault healthcare theme)
- **State**: TanStack React Query
- **Real-time**: Socket.IO
- **Crypto**: libsodium-wrappers-sumo
- **Auth**: @simplewebauthn/browser
- **AI**: @google/genai (Gemini)
- **Visualization**: @xyflow/react
- **Storage**: IndexedDB (client) + JSON files (server)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- A browser that supports WebAuthn (Chrome, Safari, Firefox)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Gemini API key
```

### Environment Variables

Create a `.env.local` file with:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SESSION_SECRET=a_random_32_character_secret_here
```

### Running the App

```bash
# Development
bun run dev

# Production build
bun run build
bun run start
```

The app will be available at http://localhost:3000

## Architecture

### Security Model

- **Entity Keys** - Each entity has a keypair; the private key never leaves the client unencrypted
- **Device Keys** - Entity keys are wrapped with device-specific keys stored in IndexedDB
- **Invite/Share Codes** - Short-lived codes sealed with PBKDF2 to securely transfer keys
- **Event Encryption** - Every event payload is encrypted with the entity's content key (derived via HKDF)

### Data Flow

1. **Login** → Passkey authenticates user → Entity key loaded from IndexedDB
2. **Upload Document** → Gemini AI extracts data → Encrypt → Store via Socket.IO
3. **Link Device** → Generate invite code → Seal private key → New device decrypts
4. **Share Record** → Generate share code → Seal entity key → Recipient decrypts shared events

## Project Structure

```
medvault/
├── app/
│   ├── api/                 # Next.js API routes
│   │   ├── _lib/           # Storage utilities
│   │   ├── entities/       # Entity management
│   │   ├── invites/        # Device linking
│   │   ├── session/        # Session management
│   │   └── shares/         # Data sharing
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks (useVault, useEventStream)
│   ├── lib/                # Core libraries (crypto, api, events)
│   ├── services/           # Gemini AI service
│   ├── types/              # TypeScript types
│   └── page.tsx            # Main app page
├── server.ts               # Custom Next.js server with Socket.IO
└── package.json
```

## Security Considerations

- Gemini API calls send document content to Google - ensure HIPAA/GDPR compliance
- Consider on-device AI alternatives for sensitive documents
- PDF blobs are encrypted before storage
- Share codes have 10-minute expiry by default

## License

MIT

## Credits

Based on [TrueTrace Vault](https://github.com/...) architecture.
Built at Tech Sovereignty Hackathon.
