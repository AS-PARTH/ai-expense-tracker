# ⚡ AI-Powered Expense Tracker

An elegant, modern, and production-ready personal finance app built with **Next.js 16 (App Router)**, **React 19**, **Mongoose (MongoDB)**, **Tailwind CSS v4**, and **Groq (Llama 3.3 70B)**. 

This application lets users track expenses, manage budgets, analyze trends, and auto-fill expense details directly from SMS receipts or copy-pasted text notifications using AI.

---

🔗 **Live Demo URL**: [https://ai-expense-tracker-task.vercel.app](https://ai-expense-tracker-task.vercel.app)  
📦 **GitHub Repository**: [https://github.com/AS-PARTH/ai-expense-tracker](https://github.com/AS-PARTH/ai-expense-tracker)

---

## ✨ Key Features & "Cool Things" Integrated

### 1. 🤖 Dynamic AI Expense Auto-Fill
* **Messy Text Extraction**: Copy-paste raw text from **Indian Bank SMS notifications (UPI debits)**, **e-commerce receipts (Amazon/Zara)**, **airline bookings**, or **utility bills**. The AI extracts:
  * **Amount**: Automatically parses numerical values, currency symbols, and distinguishes the true transaction total from remaining balances or line items (e.g. Swiggy SMS notifications or multi-line restaurant receipts).
  * **Category**: Maps transaction intent to your default or custom categories.
  * **Date**: Parses absolute dates (e.g., `15-NOV-26`) as well as relative terms (e.g., `yesterday`, `today`) into standardized `YYYY-MM-DD` format.
* **LLM Confidence Scoring**: Displays `high`, `medium`, or `low` confidence feedback indicators before saving.
* **Review-Before-Save Safety**: Auto-populates the form inputs for review so you can edit details before confirmation.
* **Graceful Fallbacks**: If the AI API fails or is offline, the interface degrades gracefully and lets you fill fields manually without crashing.

### 2. 🏷️ Dynamic Custom Categories & AI Adaptation
* **User-Defined Categories**: Users can create custom categories on the fly.
* **Adapting AI Prompts**: When custom categories are created, they are **injected dynamically into the AI extraction prompt** so the LLM begins classifying new receipts into your personalized categories immediately.
* **Safe Category Deletion**: A multi-step confirmation dialog checks if the category is currently used by any expenses. If it is, it safely updates all of those expenses to the fallback `other` category in a single bulk operation and cleans up any related category budgets.

### 3. 📊 Visual Analytics & Single Round-Trip Dashboard
* **Instant Dashboard Loading**: A single consolidated route (`GET /api/dashboard/summary`) returns all month statistics, category usage, Recharts datasets, and budgets in a single parallel query—eliminating multiple API round-trips.
* **Recharts Visualizations**:
  * **Category Breakdown**: Dynamic `PieChart` showing percentage of total spent per category.
  * **Monthly Trend**: Interactive `BarChart` representing the last 6 months of historical spending with zero-filled records for empty months.
* **Overview Metrics**: At-a-glance status cards displaying monthly totals, total categories used, and current active budget warnings.

### 4. 🎯 Smart Budgets & Alerts
* **Warning Levels**: Set budget limits per category and receive color-coded badges indicating current state:
  * **On track (Green)**: Spending is within safety bounds (< 80% of budget).
  * **Near limit (Amber)**: Spending has reached or crossed 80% of the limit.
  * **Limit reached (Red)**: Spending is exactly at 100% of the limit.
  * **Over budget (Red)**: Displays the exact percentage by which you have exceeded the budget (e.g., spending ₹2,000 on a ₹1,000 budget correctly shows `Over budget (100%)`).
* **Bulk Edit**: A spreadsheet-style editing page allows saving individual category limits or committing all changes at once with a single **Save all** operation.

### 5. 📥 One-Click CSV Export
* Streams your entire expense history or logs filtered by specific months directly to a downloadable CSV file using `papaparse`.

### 6. 💎 Premium UI/UX Polish
* **Glassmorphism**: Sticky navigation bar with backdrop blur.
* **Rich Loaders**: Custom skeleton placeholders tailored to match each page's specific grid structure so there are no empty loading states.
* **Micro-Animations**: Hover-triggered translations, clean transitions, and state indicators.
* **Mobile-First Design**: Desktop data tables transform seamlessly into modern cards on smaller viewports.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: Next.js 16 (App Router), React 19, Recharts, Tailwind CSS v4, Lucide Icons, Sonner.
* **Backend**: Next.js Route Handlers (RESTful architecture).
* **Database**: MongoDB & Mongoose.
  * *Optimization*: Leverages `.lean()` queries to bypass model hydration and custom connection pooling.
  * *Database Indexes*: Optimized compound index on `{userId, date}` for fast expense filtering and unique compound index on `{userId, category}` for budgets.
* **Auth**: JWT-based session security with bcrypt password hashing (10 salt rounds) and server-side route guards (Next.js Middleware).
* **AI Provider**: Provider-agnostic OpenAI spec handler. Configured to use **Groq** (`llama-3.3-70b-versatile`) for ultra-low latency structured JSON output, with a simple 2-line configuration change to swap in OpenAI or Gemini.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js and a MongoDB instance running locally or via Atlas.

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-signing-secret
GROQ_API_KEY=your-groq-api-key # Or your OpenAI/Gemini credentials
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it.

---

## 📂 Verification & Health Checks
* Run TypeScript validation: `npx tsc --noEmit`
* Build the application: `npm run build`
* Run Linter checks: `npm run lint`
