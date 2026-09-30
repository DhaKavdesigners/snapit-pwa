# SnapIt PWA — Monorepo

> Hyperlocal commerce platform launching in KGF. Three dashboards, one shared contract.

-------

## 🏗️ Repository Structure

```
snapit-pwa/                          ← Root GitHub Repository
│
├── apps/
│   ├── customer-app/                ← [Vishva]  Customer Shopping PWA
│   ├── merchant-app/                ← [Baav]    Store/Merchant Dashboard
│   └── rider-app/                   ← [Suresh]  Rider Logistics Dashboard
│
├── shared/
│   ├── types/snapit-types.ts        ← Shared Order/Product/CartItem types
│   └── utils/formatters.ts          ← Shared currency formatter (Paise → ₹)
│
├── .gitignore
└── README.md
```

---

## 👥 Team Roles

| App | Owner | Vercel Project | Branch |
|---|---|---|---|
| `apps/customer-app` | Vishva | `snapit-customer.vercel.app` | `main` |
| `apps/merchant-app` | Baav | `snapit-merchant.vercel.app` | `main` |
| `apps/rider-app` | Suresh | `snapit-rider.vercel.app` | `main` |

---

## 🔐 Collaborator Access

Baav and Suresh use their **own GitHub accounts**. Vishva adds them as collaborators:  
`Settings → Collaborators → Add people (by username)`

They clone **this same repo**, work inside their own `apps/` subfolder, and push with their own account. Nobody needs to share passwords.

---

## 🗄️ Shared Database (Firebase / Supabase)

All three apps connect to the same backend database. The connection keys live in each app's local `.env` file. **Never commit `.env` to Git** — it is already in `.gitignore`.

Ask Vishva for the `.env` values privately via WhatsApp/DM.

---

## 🚀 Running Locally

Each app is an independent Vite project. Open a terminal inside its folder:

```bash
# Customer App
cd apps/customer-app
npm install
npm run dev

# Merchant App
cd apps/merchant-app
npm install
npm run dev

# Rider App
cd apps/rider-app
npm install
npm run dev
```

---

## ☁️ Deploying to Vercel (Each person does this once)

1. Go to [vercel.com](https://vercel.com) and sign in with **your own** GitHub account.
2. Click **Add New Project → Import Git Repository → snapit-pwa**.
3. In **Root Directory**, set it to your app folder:
   - Vishva: `apps/customer-app`
   - Baav: `apps/merchant-app`
   - Suresh: `apps/rider-app`
4. Add your `.env` variables under **Environment Variables**.
5. Click **Deploy**. ✅

Every future `git push` to `main` auto-deploys.

---

## 📦 Shared Types Usage

Import the shared types directly using a relative path (until we set up a workspace package):

```ts
// In customer-app:
import type { Order, CartItem } from '../../shared/types/snapit-types';

// In merchant-app:
import type { Order } from '../../shared/types/snapit-types';
```

---

## 📝 Git Workflow

```bash
git checkout -b feature/your-feature-name   # Always branch from main
git add .
git commit -m "feat(customer): add cart screen"
git push origin feature/your-feature-name
# Open a Pull Request → Vishva reviews → Merge to main
```
