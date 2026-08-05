# FeeSync AI

FeeSync AI – Smart College Fee Reminder Bot

Project Overview

Build a complete production-ready full-stack web application called FeeSync AI – Smart College Fee Reminder Bot.

Tagline: "Never Miss a Fee Deadline Again."

The application helps colleges automatically track student fee payments and send intelligent fee reminders to students and parents through WhatsApp, Email, and Push Notifications.

The application must be modern, secure, scalable, mobile responsive, and suitable as a professional B.Sc. Computer Science Final Year Project.

---

Technology Stack

Frontend

- React.js

- TypeScript

- Vite

- Tailwind CSS

- Shadcn UI

- React Router DOM

- React Hook Form

- Zod Validation

- Axios

- TanStack Query

- Framer Motion

- Lucide Icons

Backend

- Node.js

- Express.js

- PostgreSQL (Supabase)

- Prisma ORM

Authentication

- Google OAuth 2.0

- Email & Password Login

- JWT Authentication

- Refresh Tokens

- Secure Cookies

- Remember Me

- Multi Device Login

- Secure Logout

Cloud Services

- Supabase Database

- Supabase Storage

- Twilio WhatsApp API

- Nodemailer

- Firebase Cloud Messaging

Deployment

- Frontend → Vercel

- Backend → Render

- Database → Supabase PostgreSQL

---

User Roles

Super Admin

Features:

- Platform Dashboard

- Manage Colleges

- Manage College Admin Accounts

- View All Analytics

- View Reminder Statistics

- View System Logs

- SMTP Settings

- Google OAuth Settings

- Twilio Settings

- Firebase Settings

- System Configuration

- Audit Logs

---

College Admin

Features:

- Dashboard

- Student Management

- Fee Management

- Reminder Management

- Reports

- Analytics

- Notification Center

- Import Students

- Export Reports

- Profile

- Settings

---

Student

Features:

- Dashboard

- View Fee Status

- View Due Dates

- View Reminder History

- View Notifications

- Profile Management

---

Authentication System

Create a complete authentication system.

Login Methods

Continue With Google

- Google OAuth Login

- One Click Login

- Auto Account Creation

- Gmail Verification

- Profile Photo Sync

Email Login

- Email

- Password

- Forgot Password

- OTP Verification

- Reset Password

---

Role-Based Redirect

After successful login:

- Super Admin → /super-admin/dashboard

- College Admin → /admin/dashboard

- Student → /student/dashboard

Protect all routes.

Implement role-based access control.

---

UI / UX Design

Create a premium modern design.

Theme

- White Theme

- Black Theme (Dark Mode)

- Theme Toggle

Design Style

- Glassmorphism

- Modern Dashboard

- Rounded Cards

- Soft Shadows

- Smooth Animations

- Beautiful Tables

- Professional Forms

- Modern Sidebar

- Mobile Responsive

- Tablet Responsive

- Desktop Responsive

Colors

Light Theme:

- White

- Gray

- Blue Accent

Dark Theme:

- Black

- Dark Gray

- Blue Accent

Success:

- Green

Warning:

- Orange

Danger:

- Red

---

Student Management

College Admin can:

- Add Student

- Edit Student

- Delete Student

- View Student

- Search Student

- Filter Student

- Import Excel

- Import CSV

- Export Excel

- Export CSV

Student Fields:

- Student Name

- Register Number

- Department

- Course

- Year

- Semester

- Section

- Student Phone

- Parent Phone

- Student Email

- Parent Email

- Address

- Profile Photo

- Total Fee

- Paid Fee

- Balance Fee

- Due Date

- Status

---

Fee Management

Manage:

- Total Fee

- Paid Fee

- Pending Fee

- Balance Fee

- Due Date

- Late Fee

- Scholarship

- Discount

Automatic Balance Calculation.

---

Dashboard Analytics

Show KPI Cards:

- Total Students

- Pending Fees

- Paid Fees

- Total Collection

- Today's Reminders

- Upcoming Due Fees

- Overdue Students

- Reminder Success Rate

- Reminder Failure Rate

Charts:

- Monthly Collection

- Pending Collection

- Reminder Statistics

- Payment Analysis

---

AI Reminder Engine

Build an intelligent reminder engine.

Automatically check due dates daily.

Send reminders:

- 15 Days Before Due Date

- 7 Days Before Due Date

- 3 Days Before Due Date

- On Due Date

- 1 Day After Due Date

- Every 7 Days After Due Date Until Payment

- Maximum 3 Overdue Reminders

Stop reminders automatically once payment is completed.

Prevent duplicate reminders.

Automatically retry failed reminders.

---

Reminder Channels

Send reminders through:

- WhatsApp

- Email

- Push Notification

Recipients:

- Student

- Parent / Guardian

Track:

- Sent

- Delivered

- Failed

- Retry Count

---

WhatsApp Reminder Message

Send bilingual reminders.

English

Hello {{StudentName}},

Your college fee balance of ₹{{BalanceFee}} is due on {{DueDate}}.

Please complete your payment before the due date.

Thank you.

{{CollegeName}}

Tamil

வணக்கம் {{StudentName}},

உங்கள் கல்லூரி கட்டணத்தில் ₹{{BalanceFee}} நிலுவையாக உள்ளது.

கட்டணம் செலுத்த வேண்டிய தேதி: {{DueDate}}

தயவுசெய்து குறிப்பிட்ட தேதிக்குள் கட்டணத்தை செலுத்துங்கள்.

நன்றி.

{{CollegeName}}

---

Email Reminder System

Create responsive HTML emails.

Include:

- College Logo

- Student Name

- Register Number

- Department

- Total Fee

- Paid Fee

- Balance Fee

- Due Date

- Support Contact

- Payment Link Button

Display both English and Tamil content.

---

Push Notifications

Send reminders using Firebase Cloud Messaging.

Support:

- Upcoming Due Reminder

- Due Today Reminder

- Overdue Reminder

- Payment Confirmation

---

Notification Center

Features:

- Bell Icon

- Unread Count

- Mark as Read

- Delete Notification

- Search Notifications

- Notification History

---

Reports

Generate:

- Student Report

- Pending Fee Report

- Paid Fee Report

- Reminder Report

- Monthly Report

- Annual Report

Export:

- PDF

- Excel

- CSV

---

Reminder Logs

Store:

- Student Name

- Register Number

- Reminder Date

- Reminder Type

- Reminder Channel

- Delivery Status

- Retry Count

- Sent By

---

Settings

Manage:

- College Name

- College Logo

- Email

- Phone Number

- WhatsApp Number

- SMTP Configuration

- Twilio Configuration

- Firebase Configuration

- Google OAuth Configuration

- Reminder Language

- Reminder Schedule

- Theme Settings

---

Security

Implement:

- JWT Authentication

- Refresh Tokens

- Password Hashing (bcrypt)

- Helmet

- CORS

- Rate Limiting

- Input Validation

- SQL Injection Protection

- XSS Protection

- Secure Environment Variables

- Audit Logs

---

Database Tables

- Users

- Roles

- Students

- FeeRecords

- ReminderLogs

- Notifications

- Settings

- RefreshTokens

- AuditLogs

---

Final Requirements

Generate a complete production-ready application with:

- Clean Architecture

- Professional Folder Structure

- Responsive Design

- Modern UI/UX

- Google Login

- Email Login

- Super Admin Dashboard

- College Admin Dashboard

- Student Dashboard

- AI Reminder Engine

- WhatsApp Integration

- Email Integration

- Push Notifications

- Dashboard Analytics

- Excel / CSV Import & Export

- PDF Reports

- Role-Based Access Control

- Dark & Light Theme

- Production-Level Security

Ensure all pages, routes, APIs, dashboards, authentication flows, reminders, reports, and notifications are fully functional with no blank pages, no routing issues, no TypeScript errors, no runtime errors, and ready for deployment on Vercel and Render.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://college-remind.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fa43347b-d7bd-4469-9e75-ef89add2c357).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
