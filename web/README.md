# ملعب المهام

Next.js multi-user app with the same Arabic RTL UI as the Task Playground prototype.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (swap `DATABASE_URL` for Postgres later)
- Cookie sessions (jose + bcryptjs)

## Setup

```bash
cd web
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo accounts

Password for all: `demo1234`

| Email | Name |
|-------|------|
| sara@demo.local | سارة العتيبي |
| ahmed@demo.local | أحمد |
| noura@demo.local | نورة |
| khaled@demo.local | خالد |
| mhd@demo.local | محمد |

Demo team invite code: `MARKETING`

## Features

- Auth (register / login)
- Create / join teams
- Tasks with live timer
- Peer star ratings (owner cannot rate own task)
- Points, dashboard, leaderboard, profile — same look as the prototype
