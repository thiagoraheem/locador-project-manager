# ProjectFlow - Project Management System

## Overview

ProjectFlow is a comprehensive project management web application built with modern technologies. It provides a full-stack solution for managing projects, tickets, tasks, and milestones with features like dashboard analytics, Gantt charts, and team collaboration. The application uses a clean, component-based architecture with TypeScript throughout the stack.

## Recent Changes

- **August 17, 2025**: Successfully migrated ProjectFlow from Replit Agent to standard Replit environment
- **Database**: Configured SQL Server connection with trustServerCertificate = true using environment variables
- **Authentication**: Fixed user creation system with proper role-based access control
- **Task Creation**: Resolved date validation issues by implementing proper date string conversion from frontend Date objects to backend string format (YYYY-MM-DD)
- **Project Status**: All core features operational including project creation, user management, task creation, and dashboard statistics

## User Preferences

Preferred communication style: Simple, everyday language.
Date restrictions: Allow retroactive project creation with past dates for flexible project timeline management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Custom component library based on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js as the web framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with JSON responses and comprehensive error handling
- **Development**: Hot module replacement (HMR) via Vite integration for seamless development

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Data Models**: 
  - Users with role-based access
  - Projects with status tracking (planning, in_progress, review, completed, on_hold)
  - Tickets with priority levels (low, medium, high, critical) and status workflow
  - Tasks with completion tracking
  - Milestones for project timeline management
- **Relationships**: Foreign key relationships between entities with proper cascade handling

### Authentication & Authorization
- Session-based authentication with PostgreSQL session storage
- Role-based access control system
- Secure password handling and user management

### Component Architecture
- **Layout System**: Modular sidebar navigation with responsive design
- **Page Components**: Dashboard, Projects, Tickets, and Gantt chart views
- **Reusable UI**: Comprehensive component library with consistent styling
- **Modal System**: Dialog-based forms for creating projects and tickets
- **Data Visualization**: Custom Gantt chart component and dashboard statistics

### Development Experience
- **Type Safety**: End-to-end TypeScript with shared schema definitions
- **Code Organization**: Clear separation between client, server, and shared code
- **Build Process**: Optimized production builds with static asset serving
- **Development Tools**: Hot reloading, error overlay, and development banner integration

## External Dependencies

### Database & Hosting
- **@neondatabase/serverless**: Serverless PostgreSQL database connection with WebSocket support
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Frontend Libraries
- **@tanstack/react-query**: Server state management and data fetching
- **@radix-ui/***: Headless UI component primitives for accessibility
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Zod integration for form validation
- **wouter**: Lightweight routing library
- **date-fns**: Date manipulation and formatting utilities
- **embla-carousel-react**: Touch-friendly carousel component

### Backend Libraries
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **drizzle-kit**: Database migration and introspection tools
- **zod**: Runtime type validation and schema definition
- **express**: Web application framework for Node.js

### Development & Build Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution environment
- **esbuild**: Fast JavaScript bundler for production builds
- **tailwindcss**: Utility-first CSS framework
- **postcss**: CSS processing tool

### UI & Styling
- **class-variance-authority**: Utility for creating component variants
- **clsx**: Conditional className utility
- **tailwind-merge**: Tailwind CSS class merging utility
- **lucide-react**: Modern icon library with React components