# Project Changelog

All notable changes to the rol-outfit project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Product Avatar & File Upload** (2026-04-28)
  - New `avatar TEXT NULL` column to products table (migration 000008)
  - Avatar field integration into Product model, DTOs, Create/Update requests
  - File upload endpoints: `POST /api/v1/uploads` (authenticated), `DELETE /api/v1/uploads/:filename` (admin)
  - Upload service with MIME validation (JPEG, PNG, WebP, GIF), max size enforcement, and safe file deletion
  - Local filesystem storage at `backend/uploads/`, proxied via Nginx `/uploads/` static path
  - Configuration: `UploadDir`, `UploadURL`, `UploadMaxSize` environment variables
  - Docker volume for uploads shared between backend (rw) and Nginx (ro)
  - Nginx client body limit increased to 10MB for `/api/` location

## [v0.1.0] - 2026-04-28

### Added
- **Project Initialization**
  - Go 1.26 + Fiber v3 backend with PostgreSQL
  - Docker dev environment with hot reload (Air for Go, Next.js HMR)
  - Nginx reverse proxy at http://localhost
  - Makefile with common commands (up, down, rebuild, logs, db-shell, backend-shell, frontend-shell)

- **User Authentication & Authorization**
  - User registration and login endpoints
  - JWT authentication with Bearer tokens
  - RBAC (Role-Based Access Control) middleware
  - Password hashing and validation

- **Full CRUD Operations**
  - **Categories**: Create, Read, Update, Delete with slug generation
  - **Products**: Create, Read, Update, Delete with category relationships
  - **Cart**: Add/remove items, retrieve user cart
  - **Orders**: Create orders from cart, view order history

- **Architecture & Infrastructure**
  - Repository pattern with transaction support
  - Service layer with business logic
  - DTO/Request/Response types for API contracts
  - GORM models with proper relationships
  - i18n support (Vietnamese, Japanese locales)
  - Error handling with consistent response format
  - Validation using ozzo-validation

