# Overview

Opian Rewards is a gamified investor portal inspired by the Ascendancy Project, built as a full-stack web application. The platform presents investment opportunities as an RPG-style experience where investors choose "player tiers" (Builder, Innovator, Visionary) with different investment amounts and payment structures. The application features a futuristic AI-driven theme with quest-based progression tracking, animated shader backgrounds, and integrated payment processing through Adumo for South African users.

# Recent Changes (September 30, 2025)

## Replit Environment Setup
- Configured MySQL database connection using Xneelo hosting credentials
- Fixed drizzle.config.ts to use MySQL dialect (was incorrectly set to PostgreSQL)
- Verified Vite configuration has allowedHosts enabled for Replit proxy support
- Configured workflow for port 5000 with webview output
- Configured autoscale deployment for production

## Security Enhancements for Adumo Payment Integration
Implemented critical security improvements to prevent payment fraud and ensure PCI compliance:

### 1. Replay Attack Protection
- Added duplicate webhook detection to prevent the same payment from being processed multiple times
- Checks if payment status is already "completed" before processing webhook
- Prevents attackers from replaying successful webhooks to gain unauthorized access

### 2. Amount Validation
- Validates that the amount received from Adumo matches the expected payment amount
- Converts amounts correctly (cents vs currency) to prevent rounding errors
- Rejects webhooks with amount mismatches to prevent payment manipulation

### 3. Webhook Signature Verification
- Implemented HMAC SHA-256 signature verification for webhooks
- Uses timing-safe comparison to prevent timing attacks
- Supports configurable ADUMO_WEBHOOK_SECRET environment variable

### 4. Transaction Tracking
- Creates transaction records at payment initiation with PENDING status
- Updates transaction status only after webhook confirmation
- Links transactions properly to payments and investors

### 5. Idempotency Improvements
- Quest progress only initialized once (checks if already exists)
- Payment status transitions are one-way (pending → completed)
- Legacy format support maintains backwards compatibility

## Investor Portal System
Implemented comprehensive investor login portal for managing investments:

### Authentication System
- Email + last 4 digits of phone number authentication
- JWT token-based session management (7-day validity)
- Secure token storage in localStorage
- Protected routes with automatic redirect to login

### Dashboard Features
- **Overview Tab**: Total investment amount, tier information, membership details
- **Transactions Tab**: Complete payment history with status tracking
- **Progress Tab**: Quest progression tracking with level, phase, and milestones
- **Invoices Tab**: Outstanding and paid invoices with payment functionality

### Technical Implementation
- React context for global authentication state
- Protected route pattern for authenticated pages
- Authorization headers for API requests
- Automatic session restoration on page reload
- Responsive design matching the futuristic brand theme

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18 using TypeScript and Vite as the build tool. The UI leverages shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS using a custom futuristic color scheme. The design system uses CSS custom properties for theming with Orbitron and Exo 2 fonts for the sci-fi aesthetic.

Key frontend patterns:
- **Component-based architecture**: Modular UI components in `/client/src/components/`
- **Custom UI library**: Extended shadcn/ui components with gaming-specific elements like `AnimatedButton`, `TierCard`, and `ProgressBar`
- **Animation system**: Framer Motion for smooth transitions and interactive elements
- **Shader integration**: Custom WebGL shaders for dynamic backgrounds using fragment shaders
- **State management**: React Query (TanStack Query) for server state with custom query client configuration

## Backend Architecture
The server uses Express.js with TypeScript in a RESTful API pattern. The architecture follows a modular approach with separated concerns:

**Core server components:**
- **Express middleware**: Custom logging, JSON parsing, and error handling
- **Route organization**: Centralized route registration in `/server/routes.ts`
- **Storage abstraction**: Interface-based storage with in-memory implementation for development
- **Development integration**: Vite middleware integration for seamless full-stack development

**Data models:**
- **Users**: Basic user authentication and profile data
- **Investors**: Gamified investment tracking with tier selection and progress
- **Payments**: Transaction history and status tracking

## Payment Processing Integration
The application integrates with Adumo payment gateway for South African market compliance:

**Payment flow:**
- Client-side payment intent creation with tier and method selection
- Server-side Adumo API integration with test credentials for development
- Form-based payment redirection with return URL handling
- Webhook support for payment status updates
- Multiple payment options: lump sum, 12-month, and 24-month installments

## Database Design
Uses Drizzle ORM with PostgreSQL through Neon serverless database:

**Schema structure:**
- **users table**: Core user authentication and profile data
- **investors table**: Investment tier tracking with quest progress (JSONB)
- **payments table**: Transaction records with flexible payment data storage

The schema uses UUID primary keys and timestamps for audit trails, with JSONB fields for flexible data like quest progress and payment metadata.

## Development Workflow
The project uses a monorepo structure with shared TypeScript types:

**Build system:**
- Vite for frontend bundling with React plugin
- esbuild for server compilation in production
- TypeScript compilation with path mapping for clean imports
- Development mode with hot module replacement and error overlays

**Asset management:**
- Static assets in `/attached_assets/` for design references
- Custom shader files integrated into components
- Font loading optimization with preconnect hints

# External Dependencies

## Core Framework Dependencies
- **React ecosystem**: React 18, React Router (Wouter), React Query for state management
- **UI framework**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with custom design tokens and Framer Motion for animations
- **Build tools**: Vite with TypeScript support and various Vite plugins for development

## Database and ORM
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries with migration support
- **Database utilities**: Connection pooling via `@neondatabase/serverless`

## Payment Processing
- **Adumo Payment Gateway**: South African payment processing service
- **Integration approach**: Form-based redirection with webhook confirmations
- **Payment methods**: Credit cards, EFT, and installment options

## Development and Deployment
- **Replit platform**: Custom Vite plugins for Replit integration including cartographer and dev banner
- **Error handling**: Runtime error modal overlay for development
- **Font services**: Google Fonts API for custom typography (Orbitron, Exo 2)
- **Icon library**: Font Awesome for comprehensive icon coverage

## Utility Libraries
- **Form handling**: React Hook Form with Zod validation schemas
- **CSS utilities**: clsx and tailwind-merge for conditional styling
- **Animation**: Framer Motion for sophisticated UI animations
- **Shader support**: Custom WebGL fragment shader integration for backgrounds

The application is designed for deployment on platforms supporting Node.js with environment variable configuration for database connections and payment gateway credentials.