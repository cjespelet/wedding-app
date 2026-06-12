# Wedding App Backend

Node.js 20.14 + Express + TypeScript + PostgreSQL (Prisma) backend for the Wedding Event Companion App.

## Tech stack

- Node.js 20.14
- Express + TypeScript
- PostgreSQL + Prisma
- JWT authentication
- Cloudinary for image storage (no local disk)

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create `.env` in `backend`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/wedding_app"
JWT_SECRET="change-me-super-secret"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
PORT=4000
```

3. Run database migrations and generate Prisma client:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

4. (Optional) Seed base data (roles + super admin + demo wedding):

```bash
npm run seed
```

Super admin credentials (dev):

- Email: `admin@example.com`
- Password: `admin123`

5. Start dev server:

```bash
npm run dev
```

API base URL: `http://localhost:4000/api`

See `API.md` for the list of available endpoints.

