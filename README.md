# 🌱 GreenBnB — Sustainable Stay Booking Platform

GreenBnB is a full-stack accommodation booking platform inspired by Airbnb, designed to promote sustainable travel. It includes property discovery, booking management, host dashboards, and a foundation for eco-friendly stay discovery.

## ✨ Features

- 🏡 Browse accommodation listings and view stay details
- 📅 Booking creation and booking management
- 👤 User registration, login, and logout
- 🏠 Host dashboard and listing management
- 🌿 Sustainable accommodation concept
- 🗺️ Foundation for geospatial property search
- 🛡️ Database-backed data management with Prisma

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Testing:** Vitest

## 🚀 Getting Started

### Prerequisites

Install Node.js, npm, and PostgreSQL before starting.

### 1. Clone the repository

```bash
git clone https://github.com/vaibhavgarad95-creator/greenbnb.git
cd greenbnb/greenbnb
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the application folder using `.env.example` as a reference.

Configure your PostgreSQL connection, authentication secret, and other required values. Never commit your actual `.env` file or secrets to GitHub.

### 4. Set up the database

Review the Prisma schema and migration files, then apply the database migration using the project's configured Prisma version and environment.

```bash
npx prisma migrate deploy
npx prisma generate
```

For a new local development database, review whether your project requires a development migration workflow instead.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🧪 Testing and Build

Run unit tests:

```bash
npm test
```

Check TypeScript:

```bash
npm run typecheck
```

Build for production:

```bash
npm run build
```

## 📁 Project Structure

```text
greenbnb/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── scripts/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── bookings/
│   │   ├── host/
│   │   ├── login/
│   │   ├── register/
│   │   └── stays/
│   └── lib/
├── .env.example
├── package.json
└── README.md
```

## 🎯 Project Goals

- Encourage sustainable travel
- Provide a smooth booking experience for guests
- Give hosts tools to manage their listings and bookings
- Build a maintainable full-stack application

## 🔮 Future Improvements

- Complete map-based property search
- Expand sustainability scoring and eco-friendly filters
- Add automated integration and end-to-end tests
- Deploy the application for public access
- Improve accessibility and responsive design

## 👨‍💻 Author

**Vaibhav Garad**

- GitHub: [@vaibhagard95-creator](https://github.com/vaibhavgarad95-creator)

---

*Built as a full-stack web development project focused on sustainable accommodation.*
