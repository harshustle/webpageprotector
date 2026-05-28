# 🚀 Deploying to Vercel

This repository has been fully optimized with top-grade, Zero-Disclosure configuration to be deployed to **Vercel** with a single-click. 

---

## 🛠️ Step-by-Step Vercel Deployment

1. **Push your code to GitHub**, GitLab, or Bitbucket.
2. Sign in or sign up on [Vercel](https://vercel.com).
3. Click **Add New** ➔ **Project**.
4. Import your code repository.
5. Vercel will automatically detect the **Vite** framework preset.
6. Click **Deploy**! 🎉

Our embedded `vercel.json` will automatically direct all request routing, pointing `/api/*` to the secure Node.js server and mapping visitor routes natively to your single-page app layout.

---

## 🔒 Ephemeral Filesystem & State Notice

By default, the application saves URLs into a local file called `db.json`. 

> ⚠️ **Important:** Serverless functions are stateless and ephemeral. Every time Vercel scales down or spins up a new instance (a cold start), the `db.json` file will reset to its initial state.

### 💡 Production Recommended Upgrades

For active production environments, we highly recommend replacing the local JSON file database with a real persistent storage provider. This takes less than 3 minutes to set up:

#### A. Upstash / Vercel KV (Redis)
The fastest, most elegant choice for link shorteners. 
1. Install the SDK: `npm install @vercel/kv`
2. Update the `readDb` and `writeDb` methods in `server.ts` to use simple asynchronous getters/setters:
   ```ts
   import { kv } from '@vercel/kv';

   // Example key-value setter
   await kv.set(`link:${shortId}`, record);
   ```

#### B. MongoDB / Supabase
Any standard database connection works brilliantly. Just swap the `readDb` and `writeDb` helper definitions in `/server.ts` to execute asynchronous MongoDB insert/find queries instead.

---

Enjoy your newly minted, modern, and light **Fortress Links** gateway on Vercel!
