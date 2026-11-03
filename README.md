# Sleep Diary

A sleep diary you can install on your phone. It follows the **Consensus Sleep Diary, Modified (CSD-M)**, a clinical instrument for tracking sleep, and works out the numbers a sleep clinician actually looks at: total sleep time, time in bed, sleep efficiency, sleep latency and time awake during the night.

I first built it for myself. It has since been piloted by a real sleep clinic, which shaped a lot of the details (PDF export, emailing a report to a clinician, morning reminders).

**Try it:** [sleep-diary-psi.vercel.app](https://sleep-diary-psi.vercel.app)
**One-click demo account (no password):** [open the demo](https://sleep-diary-api.onrender.com/api/auth/demo-login/)

> The free hosting tier sleeps when idle, so the first request can take 30 to 60 seconds to wake up.

---

## What it does

- **Two-part daily entry.** Part A in the morning (the night and waking up), Part B in the evening (naps, caffeine, alcohol, medication, comments). A live preview shows your numbers as you type.
- **Dashboard** with averages over **7 days, 14 days, 30 days or all time**, plus your most recent nights.
- **Calendar and history.** Colour-coded by sleep efficiency, with edit and delete.
- **PDF report.** Pick a date range, download it, or email it straight to your clinician.
- **Morning reminders** as web push notifications, sent at the time you choose.
- **Accounts.** Email sign-up with a one-time code, password reset by code, JWT sessions.
- **Light and dark mode.** Dark by default, your choice is remembered.
- **Installable (PWA).** Works like an app on iPhone and Android.
- **Built-in instructions** for each question and how every metric is calculated, with (i) tooltips on the dashboard.

### How sleep efficiency is read

| Sleep efficiency | Label | Meaning |
|---|---|---|
| 85% or higher | Healthy | Clinically normal |
| 70 to 84% | Fair | Mildly reduced, worth watching |
| Below 70% | Poor | May point to fragmented sleep, talk to a clinician |

The maths is done on the server (`backend/diary/utils.py`) every time an entry is saved. The frontend has a mirrored copy only to show live numbers while you fill in the form.

---

## Tech stack

| Layer | What I used |
|---|---|
| Backend | Django, Django REST Framework, SimpleJWT |
| Database | PostgreSQL (Neon) |
| Frontend | React, Vite, Tailwind CSS, React Router, Lucide icons |
| Email | SendGrid |
| Reports | ReportLab (PDF) |
| Notifications | Web Push (VAPID) triggered by a scheduled call to a cron endpoint |
| Hosting | Render (API), Vercel (frontend) |

---

## Project structure

```
sleep_diary/
├── requirements.txt
├── .env                      # local settings, never committed
├── backend/
│   ├── core/                 # settings, root urls
│   ├── users/                # accounts, profile, OTP, demo login
│   ├── diary/                # sleep entries, dashboard stats, metric maths
│   ├── reports/              # PDF generation and emailing
│   ├── notifications/        # push reminders and cron endpoint
│   ├── seed_jane_doe.py      # fills the demo account with 6 months of data
│   ├── Procfile              # gunicorn start command (Render)
│   └── build.sh              # Render build steps
└── frontend/
    ├── src/
    │   ├── pages/            # Dashboard, Calendar, History, EntryForm, ...
    │   ├── components/ui/    # Navbar, Input, Tooltip, ThemeToggle, ...
    │   ├── context/          # AuthContext, ThemeContext
    │   └── utils/            # api client, sleep maths
    ├── public/               # service worker, manifest, icons
    └── vercel.json           # single-page-app rewrite
```

---

## Run it locally

You need Python 3, a recent Node (20.19+ or 22+), and a database. SQLite is fine for trying it out.

### 1. Backend

```bash
git clone https://github.com/AshraySikka/sleep-diary.git
cd sleep-diary/sleep_diary        # adjust if your folder names differ

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `sleep_diary/.env` (see the table below), for example:

```
SECRET_KEY=change-me
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

Then:

```bash
cd backend
python manage.py migrate
python manage.py runserver        # http://localhost:8000
```

With no `SENDGRID_API_KEY`, emails are printed in this terminal instead of sent, so sign-up and reset codes show up right here.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

`frontend/.env` should contain `VITE_API_URL=http://localhost:8000`.

### 3. Demo data (optional)

The seed script fills one account with six months of realistic entries, ending today. Create the user first, then seed:

```bash
python manage.py shell -c "from django.contrib.auth import get_user_model as g; from users.models import UserProfile; u=g().objects.create_user(email='sleepdiarydemo@yopmail.com', password='choose-a-password', first_name='Demo', last_name='User'); u.is_verified=True; u.save(); UserProfile.objects.create(user=u)"
python seed_jane_doe.py
```

Running the seed again clears that user's entries and rebuilds them, so it is the way to slide the demo window forward to today.

---

## Environment variables

Backend (`sleep_diary/.env` locally, the dashboard on Render in production):

| Variable | What it is |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` locally, `False` in production |
| `DATABASE_URL` | Database connection string |
| `ALLOWED_HOSTS` | Comma-separated hosts, no spaces |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend URLs allowed to call the API, no spaces. Include `http://localhost:5173` for local work and your live site URL for production |
| `FRONTEND_URL` | Where the frontend lives (used in demo-login redirects) |
| `SENDGRID_API_KEY` | Leave empty locally to print emails to the console |
| `DEFAULT_FROM_EMAIL` | Sender address. Must be a verified sender in SendGrid |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CLAIMS_EMAIL` | Keys for web push reminders |
| `CRON_SECRET` | Protects the reminder cron endpoint |

Frontend (`frontend/.env`, and `frontend/.env.production` for the live build):

| Variable | What it is |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

---

## API overview

All endpoints except sign-up, login and password reset need a JWT.

| Area | Endpoints |
|---|---|
| Auth (`/api/auth/`) | `register/`, `verify-otp/`, `resend-otp/`, `login/`, `logout/`, `token/refresh/`, `profile/`, `forgot-password/`, `reset-password/`, `demo-login/`, `push-subscription/` |
| Diary (`/api/diary/`) | `entries/`, `entries/<date>/`, `calendar/?month=YYYY-MM`, `dashboard/?days=7\|14\|30\|all`, `formulas/` |
| Reports (`/api/reports/`) | `generate/` (PDF), `email/` |
| Notifications (`/api/notifications/`) | `send-test/`, `cron/` |

Entries are addressed by date (`entries/2026-06-20/`), which keeps the calendar simple: click a day, fetch that day.

---

## Deploying

- **Backend on Render.** Build command `./build.sh`, start command from the `Procfile` (gunicorn). Set the environment variables above in Render's dashboard, not in a file.
- **Frontend on Vercel.** Root directory `frontend`, framework Vite. `vercel.json` rewrites every route to `index.html` so deep links work.
- **Database on Neon.** Paste its connection string into `DATABASE_URL`.
- **Reminders.** Point a scheduler at the `cron/` endpoint every few minutes, using `CRON_SECRET`.
- Deploy the backend and frontend together when a change touches both, so the two never disagree about the API.

---

## A note on use

This app records and summarises sleep. It does not diagnose anything. If your sleep is a concern, take your report to a clinician.

---

## Author

**Ashray Sikka**
[Portfolio](https://ashraysikka.com) · [GitHub](https://github.com/AshraySikka) · [LinkedIn](https://linkedin.com/in/ashraysikka/) · ashray15.sikka@gmail.com