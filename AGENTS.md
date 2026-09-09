<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Database Backup & Git Push Rule

Whenever instructed to build and push to GitHub, ALWAYS perform the following sequence:
1. Run `npm run build` to verify the application builds without errors.
2. Export the local MySQL database (`tempstaff_db`) to the `database/` directory using the current date in the filename:
   - `database/sql_backup_YYYY_MM_DD.sql`
   - `database/tempstaff_db_sql_backup_YYYY_MM_DD.sql`
   Command: `& "C:\MAMP\bin\mysql\bin\mysqldump.exe" -u root -proot -h 127.0.0.1 -P 3307 tempstaff_db > database/sql_backup_YYYY_MM_DD.sql`
3. Stage all changes (`git add .`), commit with a descriptive message, and push to GitHub (`git push`).
