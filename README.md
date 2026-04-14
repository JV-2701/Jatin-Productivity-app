# 📋 My Productivity App

A personal productivity app to manage tasks, track finances, and set reminders — built with React + Vite.

## Features

- ✅ **Task Manager** — Add tasks by category (Work, Health, Personal, etc.) and time period (Today / This Week / This Month)
- 📊 **Dashboard** — Visual progress ring showing how many tasks you've completed
- 💰 **Finance Tracker** — Track income and expenses in ₹ with a running balance
- 🔔 **Reminders** — Set date & time reminders, with overdue alerts

## Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- LocalStorage for data persistence (no backend needed)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- npm (comes with Node.js)

### Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open in browser
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

## Deployment

This app is deployed on [Vercel](https://vercel.com/). To deploy your own:

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com/) and import the repo
3. Click **Deploy** — no config needed

## Data Storage

All data is saved in your browser's **localStorage**. This means:
- Data persists between sessions on the same device/browser
- Clearing browser data will erase it
- Data does not sync across devices

## License

MIT — see [LICENSE](./LICENSE)
