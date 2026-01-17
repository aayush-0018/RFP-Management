# AI RFP Management System

An intelligent procurement management platform that leverages AI to streamline the RFP (Request for Proposal) process, from creation to vendor evaluation.

## Project Setup

### Prerequisites
- Node.js (version 16 or higher)
- MongoDB (local or cloud instance)
- Gmail account with app password for email functionality
- OpenRouter API key for AI services

### Install Steps
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-rfp-management-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### How to Configure Email Sending/Receiving
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password from Google Account settings
3. Update the `.env` file in the backend directory:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   IMAP_HOST=imap.gmail.com
   IMAP_PORT=993
   IMAP_USER=your-email@gmail.com
   IMAP_PASS=your-app-password
   ```

### How to Run Everything Locally
1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

4. Access the application at `http://localhost:5173`

### Any Seed Data or Initial Scripts
No seed data scripts are provided. You can manually add vendors through the frontend interface after setup.

## Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB

### AI Provider
- **OpenRouter** - OpenAI API service (using GPT models)

### Email Solution
- **Nodemailer** - Email sending
- **imap-smap mailparser** - Email receiving and parsing

## API Documentation

### RFPs
- **POST /api/rfps** - Create RFP
  - Request Body: `{ "prompt": "string" }`
  - Success Response: RFP object with structured requirements
  - Error Response: `{ "error": "Failed to create RFP" }`

- **GET /api/rfps** - Get all RFPs
  - Success Response: Array of RFP objects

- **POST /api/rfps/:id/send** - Send RFP to vendors
  - Request Body: `{ "selectedVendors": ["vendorId1", "vendorId2"] }` (optional)
  - Success Response: `{ "message": "RFP sent to X vendor(s)" }`

- **POST /api/rfps/:id/evaluate** - Evaluate proposals
  - Success Response: Array of evaluation objects with score, summary, recommendation

- **PUT /api/rfps/:id** - Update RFP
  - Request Body: `{ "prompt": "string" }`
  - Success Response: Updated RFP object

- **DELETE /api/rfps/:id** - Delete RFP
  - Success Response: `{ "message": "RFP and associated proposals deleted successfully" }`

### Proposals
- **GET /api/proposals/:rfpId** - Get proposals for RFP
  - Success Response: Array of proposal objects with vendor details

- **POST /api/proposals/:rfpId/compare** - Compare proposals
  - Request Body: `{ "proposalIds": ["id1", "id2"] }`
  - Success Response: `{ "verdict": "string", "justification": "string" }`

### Vendors
- **POST /api/vendors** - Create vendor
  - Request Body: `{ "name": "string", "email": "string", "notes": "string" }`
  - Success Response: Vendor object

- **GET /api/vendors** - Get all vendors
  - Success Response: Array of vendor objects

- **PUT /api/vendors/:id** - Update vendor
  - Request Body: `{ "name": "string", "email": "string", "notes": "string" }`
  - Success Response: Updated vendor object

- **DELETE /api/vendors/:id** - Delete vendor
  - Success Response: `{ "message": "Vendor deleted successfully" }`

### Emails
- **POST /api/emails/poll** - Poll for new emails
  - Success Response: `{ "message": "Processed X emails", "proposals": [...] }`

## Decisions & Assumptions

### Key Design Decisions
- **RFP Status Flow**: Implemented a linear status progression (DRAFT → SENT → RESPONSES_RECEIVED → DECIDED) to track RFP lifecycle
- **AI-Powered Parsing**: Used AI to convert natural language RFP descriptions into structured JSON with predefined schema for consistency
- **Email-Based Communication**: Leveraged SMTP for sending RFPs and IMAP for receiving proposals to maintain email as the primary communication channel
- **Relative AI Scoring**: Proposals are scored relatively against each other rather than absolute scales for more meaningful comparisons
- **Single Active RFP Assumption**: Email polling associates incoming proposals with the most recently created RFP for simplicity

### Assumptions Made
- **Vendor Email Matching**: All incoming proposal emails come from pre-registered vendors in the system
- **Email Content Format**: Proposals are contained within the email body text, with no complex attachments or formatting
- **Gmail Dependency**: Email functionality is built specifically for Gmail accounts with app passwords
- **Currency**: Budget amounts are assumed to be in Indian Rupees (Rs.) based on the UI display
- **Single Organization**: The system serves a single procurement organization managing multiple vendors
- **No Authentication**: No user authentication implemented, assuming single-user or internal network usage
- **AI API Reliability**: OpenRouter API is assumed to be consistently available and returning valid responses

## AI Tools Usage

### Tools Used During Development
- **VScode IDE**: Primary code editor with AI-assisted coding features
- **Kilo Code**: Code completion and suggestion for boilerplate and common patterns

### What They Helped With
- **Boilerplate Generation**: Copilot assisted in creating repetitive React components and Express routes
- **Debugging**: ChatGPT helped analyze error logs and suggest debugging strategies
- **Design Patterns**: AI tools provided suggestions for implementing CRUD operations and state management
- **API Design**: These features helped refine API endpoint structures and error handling
