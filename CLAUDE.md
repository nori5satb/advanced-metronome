# Agent Communication System

## エージェント構成

- **PRESIDENT** (別セッション): 統括責任者
- **boss1** (multiagent:agents): チームリーダー
- **worker1,2,3** (multiagent:agents): 実行担当

## あなたの役割

- **PRESIDENT**: @instructions/president.md
- **boss1**: @instructions/boss.md
- **worker1,2,3**: @instructions/worker.md

## メッセージ送信

```bash
./agent-send.sh [相手] "[メッセージ]"
```

## 基本フロー

PRESIDENT → boss1 → workers → boss1 → PRESIDENT

## Git/GitHub 管理ルール

### worker の作業フロー

1. **作業開始時**: GitHub に作業計画の issue を作成
2. **作業完了後**:
   - ローカルリポジトリにコミット
   - issue に実施内容や残課題等を記載して更新

### boss1 の管理フロー

1. **変更確認**: コミットされた変更内容を確認
2. **問題なければ**:
   - GitHub のサーバリポジトリに変更を反映
   - 対応する issue をクローズ

## Tech Stack

- **Frontend Framework**: React Router v7, React 19, TypeScript
- **Database**: SQLite (with D1 for Cloudflare Workers)
- **Testing**:
  - Unit/Integration: Vitest
  - E2E: Playwright
- **Deployment**: Cloudflare Workers
- **Runtime**: Node.js with Wrangler CLI

## Project Structure

```
/
├── src/
│   ├── components/     # Reusable UI components
│   ├── routes/        # React Router v7 route components
│   ├── lib/           # Core business logic and utilities
│   ├── db/            # Database schema and migrations
│   └── workers/       # Cloudflare Workers specific code
├── tests/
│   ├── unit/          # Vitest unit tests
│   ├── integration/   # Vitest integration tests
│   └── e2e/           # Playwright end-to-end tests
├── wrangler.toml      # Cloudflare Workers configuration
└── migrations/        # SQLite/D1 database migrations
```

## Common Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Test (Unit)**: `npm run test`
- **Test (E2E)**: `npm run test:e2e`
- **Lint**: `npm run lint`
- **Type Check**: `npm run typecheck`
- **Deploy**: `wrangler deploy`
- **DB Migrations**: `wrangler d1 migrations apply todo-db`

## Code Style & Conventions

- Use TypeScript for all source files
- Use 2-space indentation
- Prefer arrow functions over function declarations
- Use destructuring imports: `import { useState } from 'react'`
- Component files use PascalCase: `TodoItem.tsx`
- Utility files use camelCase: `dateUtils.ts`
- Use const assertions for immutable data
- Prefer async/await over Promise chains

## Database Conventions

- Table names use snake_case: `todo_items`
- Column names use snake_case: `created_at`, `is_completed`
- Use UUIDs for primary keys
- Include `created_at` and `updated_at` timestamps

## Component Patterns

- Use functional components with hooks
- Export components as default exports
- Props interfaces should end with `Props`: `TodoItemProps`
- Use React.memo for performance optimization when needed
- Keep components small and focused (single responsibility)

## Testing Guidelines

- Unit tests: Test individual functions and components
- Integration tests: Test component interactions and data flow
- E2E tests: Test complete user workflows
- Use descriptive test names: `should mark todo as completed when checkbox is clicked`
- Mock external dependencies in unit tests
- Use data-testid attributes for E2E test selectors

## Cloudflare Workers Specific

- Use Hono.js for request routing if needed
- Leverage D1 database for SQLite operations
- Use Workers KV for caching if required
- Environment variables via wrangler.toml and secrets
- Keep worker bundle size minimal

## Performance Considerations

- Lazy load routes with React Router v7
- Optimize bundle size for Cloudflare Workers limits
- Use proper SQLite indexing for queries
- Implement proper error boundaries
- Cache static assets appropriately

## Security Guidelines

- Validate all user inputs
- Use parameterized queries for database operations
- Implement proper CORS headers
- Sanitize data before storage and display
- Use HTTPS only in production
