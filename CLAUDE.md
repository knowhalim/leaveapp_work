# Simple HR Leave Management System

## Tech Stack
- **Backend:** Laravel 12, PHP 8.4, Inertia.js 2.0, Sanctum
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Recharts, Lucide icons, Sonner toasts
- **Database:** SQLite (default), supports MySQL/PostgreSQL
- **Queue/Cache/Session:** All database-driven

## Commands
- `composer setup` - Full setup (install, migrations, build)
- `composer dev` - Dev server (serve + queue + vite concurrently)
- `npm run dev` - Vite dev server only
- `npm run build` - Production frontend build (MUST run after any JSX/CSS changes)
- `php artisan test` - Run tests
- `php artisan migrate --force` - Run migrations
- `php artisan db:seed --force` - Seed database

## Deployment
- `./deploy-localv2.sh` - **Initial** deploy from local machine to VPS (fresh install)
- `./update-localv2.sh` - **Update** an already-deployed VPS (use this for all redeployments)
- `./setup-domainv2.sh` - Point deployed app to a domain with SSL (run after deploy-localv2.sh)
- `./setup-server.sh` - Alternative: run directly on VPS (clones from GitHub)
- composer.lock REQUIRES PHP 8.4 (Symfony 8.x packages need `>=8.4`)

### Azure VM (AISG)
- **IP:** 20.188.123.16 | **SSH:** `ssh -i ~/.ssh/aisg-azure.key aisg@20.188.123.16`
- **App path:** /var/www/simplehrleave

### Update rules — CRITICAL
- **NEVER overwrite the database on any VM.** Always use `update-localv2.sh` for updates — it explicitly excludes `database/database.sqlite` from rsync.
- Do NOT manually rsync without `--exclude=database/database.sqlite`.
- Do NOT run `db:seed` or drop/recreate the database on a live VM unless explicitly instructed.
- The `update-localv2.sh` script handles: rsync (no DB), composer install, npm build, migrate, cache rebuild, queue restart.

## Project Structure
```
app/
  Http/Controllers/    # Route controllers (Auth, Leave, Admin, Reports, etc.)
  Http/Middleware/      # RoleMiddleware, EnsureUserIsActive, HandleInertiaRequests
  Models/              # Eloquent models (User, Employee, LeaveType, LeaveRequest, etc.)
  Services/            # Business logic (EmailService, LeaveBalanceService, LeaveCalculationService, WebhookService)
resources/js/
  Pages/Auth/          # Login, ForgotPassword
  Pages/Admin/         # Dashboard, Users, Departments, LeaveTypes, Settings, Reports, Webhooks
  Pages/Employee/      # Dashboard, LeaveBalances
  Pages/Manager/       # Dashboard
  Pages/Leave/         # Create, Index, Show, Pending
  Layouts/             # AuthenticatedLayout
database/
  migrations/          # Schema definitions
  seeders/             # DepartmentSeeder, EmployeeTypeSeeder, LeaveTypeSeeder, AdminUserSeeder, etc.
```

## Architecture

### Roles & Access
- `super_admin` - Full system access including webhooks and email config
- `admin` - User/department/leave management, reports, settings
- `manager` - Approve/reject leave, view team dashboard
- `employee` - Apply for leave, view balances

### Key Models & Relationships
- **User** -> has one Employee -> belongs to Department, EmployeeType
- **LeaveRequest** -> belongs to Employee, LeaveType; has many Comments
- **LeaveType** -> has many LeaveTypeAllowance (per EmployeeType), EmployeeLeaveBalance
- **EmployeeLeaveBalance** -> tracks entitled/used/pending days per financial year

### Middleware aliases
- `role` -> RoleMiddleware (role-based route protection)
- `active` -> EnsureUserIsActive (blocks inactive users)

## Database
- Default: SQLite at `database/database.sqlite`
- 29 Singapore-standard leave types seeded (Vacation, Medical, Maternity, Paternity, Childcare, etc.)
- AdminUserSeeder reads `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` from .env (set during deployment, removed after seeding)

## Code Conventions
- React components: functional components only, no class components
- Inertia.js for server-driven SPA (no separate API for frontend)
- Controllers return `Inertia::render()` responses
- Leave calculations handled in `LeaveCalculationService` (excludes weekends/public holidays)
- All file uploads go to `storage/app/public/leave-attachments/`

## External API (v1)

All endpoints are prefixed `/api/v1`. See `documentation/api-documentation.md` for full details.

### Auth flow (magic link)
1. `POST /api/v1/auth/magic-link` — sends magic link to email (no token required)
2. `GET  /api/v1/auth/magic-link/{token}` — returns a 7-day Sanctum Bearer token
3. Use `Authorization: Bearer {token}` on all subsequent requests
4. `POST /api/v1/auth/logout` — revokes current token

### Leave endpoints (any authenticated user)
- `GET /api/v1/leaves/summary?email={email}` — total leave counts by status + type
- `GET /api/v1/leaves/pending?email={email}` — pending (awaiting approval) leave requests
- `GET /api/v1/leaves/history?email={email}` — approved/rejected/cancelled leave history

### Manager endpoint (manager / admin / super_admin)
- `GET /api/v1/manager/pending-approvals?email={email}` — subordinates' pending requests

### Report endpoint (admin / super_admin)
- `POST /api/v1/reports/generate` — generates CSV, emails to requesting user
  - Body: `email`, `report_type` (leave_summary|department_summary|employee_leave), `year?`, `department_id?`

### New controllers
- `app/Http/Controllers/Api/AuthApiController.php`
- `app/Http/Controllers/Api/LeaveApiController.php`
- `app/Http/Controllers/Api/ReportApiController.php`
- Email template: `resources/views/emails/report.blade.php`
- `EmailService::sendReportEmail()` added for report attachment emails

## Gotchas
- MUST run `npm run build` after frontend changes - Vite output goes to `public/build/`
- SQLite database file must be owned by `www-data` on the server
- Permissions: `storage/` and `bootstrap/cache/` must be writable by `www-data`
- `storage:link` creates symlink from `public/storage` -> `storage/app/public`
- The deploy scripts add 2GB swap on low-memory VPS to prevent OOM during builds
- Nginx config must point to the correct PHP-FPM socket version (php8.4-fpm.sock)
