# Overview

Opian Rewards is a gamified investor portal, inspired by the Ascendancy Project, built as a full-stack web application. It transforms investment opportunities into an RPG-style experience where investors select "player tiers" (Builder, Innovator, Visionary) with varying investment amounts and payment structures. The platform features a futuristic, AI-driven theme with quest-based progression tracking, animated shader backgrounds, and integrated payment processing via Adumo for South African users. The project aims to provide a unique and engaging investment experience, enhancing user interaction and retention through gamification.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18, TypeScript, and Vite. It utilizes shadcn/ui components based on Radix UI primitives, styled with Tailwind CSS, and features a custom futuristic color scheme using Orbitron and Exo 2 fonts. Key patterns include a component-based architecture, a custom UI library extending shadcn/ui, Framer Motion for animations, custom WebGL shaders for dynamic backgrounds, and React Query for server state management. The authentication flow uses a two-step OTP process with JWT token storage and authorization.

## Backend Architecture
The server uses Express.js with TypeScript, following a RESTful API pattern. It features modular organization, custom middleware for logging and error handling, and centralized route registration. Development integration includes Vite middleware. Core data models include Users, Investors, and Payments. Security enhancements include OTP-based authentication, robust rate limiting, and JWT security hardening with environment-based secrets. SMTP email integration via Nodemailer handles OTP delivery and other communications.

## Payment Processing Integration
The application integrates with the Adumo payment gateway, designed for the South African market. The payment flow involves client-side intent creation, server-side Adumo API interaction, form-based redirection, and webhook support for status updates. It supports multiple payment options including lump sum, 12-month, and 24-month installments. Security measures for Adumo integration include replay attack protection, amount validation, webhook signature verification using HMAC SHA-256, and detailed transaction tracking.

## Database Design
The system uses Drizzle ORM with PostgreSQL, leveraging Neon serverless database. The schema includes `users` (authentication, profile), `investors` (investment tiers, quest progress via JSONB), and `payments` (transaction records). UUID primary keys and timestamps are used for audit trails, with JSONB fields providing flexibility for dynamic data.

## Development Workflow
The project adopts a monorepo structure with shared TypeScript types. It uses Vite for frontend bundling and esbuild for server compilation. The development environment supports hot module replacement and error overlays.

# External Dependencies

- **Core Frameworks**: React 18, React Router (Wouter), React Query, Radix UI, shadcn/ui, Tailwind CSS, Framer Motion.
- **Database**: Neon Database (PostgreSQL), Drizzle ORM, `@neondatabase/serverless`.
- **Payment Gateway**: Adumo Payment Gateway.
- **Email Service**: Nodemailer (for SMTP integration).
- **Build & Deployment**: Vite, esbuild, Replit platform integration.
- **Utilities**: React Hook Form, Zod, clsx, tailwind-merge, Google Fonts (Orbitron, Exo 2), Font Awesome.