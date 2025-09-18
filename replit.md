# Overview

Opian Rewards is a gamified investor portal inspired by the Ascendancy Project, built as a full-stack web application. The platform presents investment opportunities as an RPG-style experience where investors choose "player tiers" (Builder, Innovator, Visionary) with different investment amounts and payment structures. The application features a futuristic AI-driven theme with quest-based progression tracking, animated shader backgrounds, and integrated payment processing through Adumo for South African users.

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