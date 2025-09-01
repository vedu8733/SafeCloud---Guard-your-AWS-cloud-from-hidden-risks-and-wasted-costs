# SafeCloud

**Guard your AWS cloud from hidden risks and wasted costs**

SafeCloud is a full‑stack app that scans AWS S3 for sensitive data patterns, highlights security/compliance issues, and helps you reduce risk and cost. It integrates AWS Cognito for secure login and assumes a least‑privilege IAM role via STS for read‑only scans. Results are shown in a modern dashboard and exportable as a PDF report.

## Why this project exists (Problem → Solution)
- Problem: Organizations store massive data in S3. Secrets, PII, and misconfigurations can slip in. Manual reviews are slow, expensive, and often missed.
- Solution: SafeCloud connects securely to your AWS account, scans S3 objects for risky patterns (keys, tokens, PII), and summarizes findings with severity, compliance score, and potential savings. You get actionable insights and a downloadable report.

## Output 

## Screenshots

<table>
<tr>
<td><img src="Screenshot 2025-09-01 133619.png" width="250"/></td>
<td><img src="Screenshot 2025-09-01 133630.png" width="250"/></td>
<td><img src="Screenshot 2025-09-01 133640.png" width="250"/></td>
</tr>
<tr>
<td><img src="Screenshot 2025-09-01 133815.png" width="250"/></td>
<td><img src="Screenshot 2025-09-01 133847.png" width="250"/></td>
<td><img src="Screenshot 2025-09-01 133920.png" width="250"/></td>
</tr>
<tr>
<td><img src="Screenshot 2025-09-01 133936.png" width="250"/></td>
<td><img src="Screenshot 2025-09-01 134025.png" width="250"/></td>
<td><img src="Screenshot 2025-09-01 134034.png" width="250"/></td>
</tr>
<tr>
<td><img src="Screenshot 2025-09-01 134041.png" width="250"/></td>
<td><img src="Screenshot 2025-09-01 134055.png" width="250"/></td>
</tr>
</table>


## Core features
- Secure AWS connect (Cognito + STS AssumeRole)
- S3 scan for sensitive patterns (secrets, tokens, PII) with severity
- Compliance summary: issues by severity, overall score, estimated savings
- Findings table + details; cached results and scan status
- One‑click PDF report export
- Health/status and debug endpoints
- Modern, responsive UI 

## Tech stack
- Frontend: Next.js 14 (App Router, TypeScript), TailwindCSS, shadcn/ui, Framer Motion, Recharts, lucide-react
- Backend: Node.js, Express, `@aws-sdk/*`, pdfkit, express‑session, helmet, cors
- AuthN/AuthZ: AWS Cognito (OAuth2/OIDC) + IAM AssumeRoleWithWebIdentity (STS)
- Logging: custom logger in backend with leveled logs

## Why Cognito and IAM (security rationale)
- Cognito gives hosted OAuth2/OIDC, MFA support, and JWTs. We never handle passwords.
- After login, we exchange the code for tokens and validate the ID token against Cognito JWKS.
- Using STS AssumeRoleWithWebIdentity, we assume a read‑only IAM role in your AWS account. This:
  - Enforces least privilege by policy
  - Avoids storing long‑lived AWS keys
  - Limits blast radius via session expiration and scoping

## How the web flow works (end‑to‑end)
1. User clicks “Connect AWS”. Backend returns a Cognito Hosted UI login URL: `GET /auth/login-url`.
2. User authenticates with Cognito and is redirected to backend `/auth/callback?code=...`.
3. Backend exchanges `code` for tokens, validates ID token, extracts user, then calls STS AssumeRoleWithWebIdentity to get temporary AWS creds.
4. Temporary creds are stored in the server session. The UI can now request:
   - Run scan: `POST /scan/run`
   - Read summary: `GET /scan/summary`
   - Read findings: `GET /scan/findings`
   - Download report: `GET /scan/report.pdf`
5. Session expiration is aligned with STS creds; re‑auth is required when expired.

## Key backend endpoints
- Auth
  - `GET /auth/login-url` → returns Cognito login URL
  - `GET /auth/callback` → handles OAuth callback, creates session, assumes role
  - `POST /auth/logout` → clears session (requires session)
  - `GET /auth/me` → returns current user/session info (requires session)
  - `GET /auth/status` → public session status
- AWS
  - `GET /aws/status` → assumed role/account info (requires session)
  - `GET /aws/s3/list` → list S3 buckets (requires session)
  - `POST /aws/refresh` → refresh credentials (requires session)
  - `GET /aws/health` → public health
- Scan
  - `POST /scan/run` → start a scan (uses session creds)
  - `GET /scan/summary` → compliance metrics
  - `GET /scan/findings` → detailed results
  - `GET /scan/status` → scan progress + last scan time
  - `GET /scan/report.pdf` → PDF report
  - `DELETE /scan/cache` → clear cached results
  - `GET /scan/debug` → session debug
  - `GET /scan/test-permissions` → S3 access probe (dev/testing)

## Scanner overview
- Lists buckets, samples up to 200 objects per bucket
- Skips binary file extensions
- Reads first 500KB of text and matches patterns (e.g., access keys, tokens, emails)
- Aggregates per‑object matches into findings grouped by severity
- Computes overall compliance score and estimated savings

## Project structure (simple English)
- `app/` — Next.js frontend pages
  - `page.tsx` Landing page
  - `connect/page.tsx` Connect AWS flow
  - `dashboard/page.tsx` Dashboard with charts/tables
  - `layout.tsx`, `globals.css` Shared layout/styles
- `components/` — Reusable UI pieces
  - `Navbar.tsx`, `Footer.tsx`, `ui/*` Cards, badges, etc.
- `lib/` — Frontend helpers and mock data
  - `api.ts` API client; `mockData.ts` demo data
- `backend/` — Express server and services
  - `server.js` App setup, middleware, routes
  - `src/routes/` Route files: `auth.js`, `aws.js`, `scan.js`
  - `src/controllers/` Request handlers: `authController.js`, `awsController.js`, `scanController.js`
  - `src/services/scanner.js` S3 scanning logic
  - `src/middleware/auth.js` Session/token validation
  - `src/utils/` AWS/Cognito helpers, logger, error handling, patterns
  - `logs/` Log files

## Local development
1. Install deps in both roots:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```
2. Configure environment variables:
   - Copy `backend/env.example` → `.env` in `backend/`, fill values (see below)
3. Start backend:
   ```bash
   cd backend
   npm run start
   # or: ./start.bat
   ```
4. Start frontend in another terminal (project root):
   ```bash
   npm run dev
   # App: http://localhost:3000  |  API: http://localhost:8000
   ```

## Backend environment variables
Create `backend/.env` and set:
- `PORT` — default `8000`
- `SESSION_SECRET` — random string for session cookies
- `COGNITO_REGION` — e.g. `us-east-1`
- `COGNITO_DOMAIN` — Cognito Hosted UI domain, e.g. `https://your-domain.auth.us-east-1.amazoncognito.com`
- `COGNITO_USER_POOL_ID` — Cognito User Pool ID
- `COGNITO_CLIENT_ID` — App client ID
- `COGNITO_CLIENT_SECRET` — App client secret (if enabled)
- `COGNITO_REDIRECT_URI` — e.g. `http://localhost:8000/auth/callback`
- `ASSUME_ROLE_ARN` — IAM role ARN in your AWS account with read‑only S3 permissions
- `ASSUME_ROLE_SESSION_NAME` — e.g. `SafeCloudSession`
- `LOG_LEVEL` — optional, `debug|info|warn|error`
- `NODE_ENV` — `development|production`

Minimal IAM policy example (attach to the role referenced by `ASSUME_ROLE_ARN`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListAllMyBuckets", "s3:ListBucket", "s3:GetObject"],
      "Resource": "*"
    }
  ]
}
```

## Scripts
- Root
  - `npm run dev` → start Next.js app
- Backend
  - `npm run start` → start Express server
  - `start.bat`, `start-debug.bat` → Windows helpers

## Notes & assumptions
- Scans are read‑only and best‑effort; very large/binary files and KMS‑encrypted objects may be skipped.
- Credentials are short‑lived; when expired, re‑authenticate via Cognito.
- Demo/mock mode is available in the UI for quick preview without AWS.

## Roadmap ideas
- More AWS checks (CIS mapping, public S3 posture, GuardDuty/Security Hub ingest)
- Scheduling, notifications (Slack/Email), and ticketing integrations
- IaC scanning and policy‑as‑code with OPA/Rego
- Least‑privilege policy generator and remediation playbooks
