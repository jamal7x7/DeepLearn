# Deploying to Vercel

This project is a Next.js (App Router) application with a Drizzle ORM backend. To deploy successfully to Vercel, follow these steps:

---

## 1. **Prepare Environment Variables**
- Make sure you have a `.env.production` file with all required secrets (database URL, API keys, etc). Example:

```
DATABASE_URL=your_production_database_url
NEXTAUTH_SECRET=your_secret
NEXT_PUBLIC_API_URL=https://your-vercel-domain.vercel.app
```

- Do **not** commit `.env*` files; instead, add these in the Vercel dashboard under Project > Settings > Environment Variables.

---

## 2. **Check Database Migrations**
- If you use Drizzle or another ORM, ensure your production database is migrated. Vercel does not run migrations automatically.
- Run locally before deploy:
  ```sh
  pnpm drizzle-kit push:pg
  # or your migration command
  ```

---

## 3. **Vercel Project Settings**
- Framework Preset: **Next.js**
- Root Directory: `/`
- Output Directory: `.next`
- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Development Command: `pnpm dev`

---

## 4. **Deploy**
- Push your code to GitHub/GitLab/Bitbucket.
- Import your repo in the [Vercel dashboard](https://vercel.com/dashboard).
- Set environment variables.
- Click **Deploy**.

---

## 5. **Post-Deploy**
- Test your production site at `https://your-vercel-domain.vercel.app`.
- Check API routes, database connectivity, and authentication.

---

## 6. **Troubleshooting**
- If you see 500 errors, check your environment variables and database connection.
- For Drizzle migrations, run them manually if needed.
- Review Vercel build logs for missing dependencies or config issues.

---

### See also:
- [Vercel Docs: Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Drizzle ORM Deployment](https://orm.drizzle.team/docs/deployment)

---

**This project is now ready for Vercel deployment!**
