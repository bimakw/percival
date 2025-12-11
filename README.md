# PMO - Project Management Office

A full-stack Project Management Office application built with modern technologies.

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Rust + Axum
- **Database**: PostgreSQL

## Features

- **Project Management**: Create, update, and track projects with timelines and budgets
- **Task Management**: Assign tasks, track progress, set priorities and due dates
- **Team & Resources**: Manage teams, assign members, track resource allocation
- **Dashboard & Reports**: Visual analytics, progress charts, and reporting

## Project Structure

```
pmo/
├── frontend/           # Next.js TypeScript frontend
├── backend/            # Rust Axum API server
├── database/           # PostgreSQL schema and migrations
└── docs/               # Documentation
```

## Getting Started

### Quick Start with Docker

The easiest way to run the entire stack:

```bash
# Build and run all services
docker compose up -d

# Or use make
make build
make run
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

### Development Setup

For local development, run only the database in Docker:

```bash
# Start database only
make dev-db

# Run backend (in separate terminal)
make dev-backend

# Run frontend (in separate terminal)
make dev-frontend
```

### Prerequisites (for local development)

- Node.js 18+
- Rust 1.75+
- Docker & Docker Compose

### Manual Database Setup

1. Create a PostgreSQL database:

```bash
createdb pmo_db
```

2. Run the schema:

```bash
psql -d pmo_db -f database/schema.sql
```

3. (Optional) Load seed data:

```bash
psql -d pmo_db -f database/seed.sql
```

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Run the server:

```bash
cargo run
```

The API will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login

### Projects
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project
- `GET /api/v1/projects/{id}/tasks` - Get project tasks
- `GET /api/v1/projects/{id}/milestones` - Get project milestones

### Tasks
- `GET /api/v1/tasks` - List all tasks
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/{id}` - Get task details
- `PUT /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task

### Teams
- `GET /api/v1/teams` - List all teams
- `POST /api/v1/teams` - Create team
- `GET /api/v1/teams/{id}` - Get team details
- `PUT /api/v1/teams/{id}` - Update team
- `DELETE /api/v1/teams/{id}` - Delete team
- `GET /api/v1/teams/{id}/members` - Get team members
- `POST /api/v1/teams/{id}/members` - Add team member

## Database Schema

### Tables
- `users` - User accounts with roles (admin, manager, member)
- `teams` - Team groups
- `team_members` - Team membership
- `projects` - Project details with status and budget
- `project_members` - Project membership
- `milestones` - Project milestones
- `tasks` - Task items with assignments
- `task_comments` - Task comments/discussions
- `activity_logs` - Audit trail

## License

MIT
