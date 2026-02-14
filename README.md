<div align="center">

<img src="logo.svg" alt="Percival Logo" width="120" height="120">

# Percival

Project management app — Next.js 16 frontend + Rust/Axum backend + PostgreSQL.

**[Demo](https://percival-pmo.netlify.app)**

</div>

## Running

```bash
docker compose up -d
```

Frontend at `:3000`, API at `:8080`.

For dev, run each service separately:

```bash
make dev-db
make dev-backend   # separate terminal
make dev-frontend  # separate terminal
```

## What It Does

- Projects with timelines and budgets
- Task assignment and tracking
- Team and resource management
- Dashboard with charts and reports
- Auth with role-based access

## Testing

```bash
cd backend && cargo test
cd frontend && npm run test:run
```

## License

MIT — see [LICENSE](LICENSE).
