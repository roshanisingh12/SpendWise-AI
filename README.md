
# 💰 Spendwise AI — AI Personal Finance Manager

> **See your money. Understand your future.**

Spendwise AI is a **privacy-first AI Personal Finance Manager** designed as a college-level AI & Data Science project. It helps users track income and expenses, understand spending patterns, create budgets, predict future expenses, detect unusual spending, monitor savings goals, and receive AI-generated financial insights.

The core idea is:

**Track → Understand → Predict → Recommend → Improve**

---

## 🎯 Problem Statement

Managing personal finances can be difficult because users often do not know:

- Where most of their money is being spent
- Whether they are overspending
- How much they can safely spend
- Whether they are on track toward a savings goal
- How much they may spend in the future

Existing expense trackers mainly display transaction records. Spendwise AI aims to go one step further by combining **Machine Learning + Generative AI + Data Security** to provide personalized insights.

---

## 💡 Proposed Solution

Spendwise AI analyzes financial transaction data and converts it into understandable recommendations.

For example:

> **AI Insight:** Your shopping expenses increased by 32% compared with last month. Reducing non-essential shopping by ₹1,500 could help you reach your savings goal earlier.

The system does **not** require users to provide banking passwords, UPI PINs, OTPs, CVV, or other authentication secrets.

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │        USER         │
                         │                     │
                         │  Add Transaction    │
                         │  Upload Statement   │
                         │  Set Savings Goal   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │      INPUT LAYER          │
                    │                           │
                    │ • Manual Transactions     │
                    │ • GPay/Bank Statement     │
                    │   Upload (PDF/CSV)        │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │     DATA PROCESSING       │
                    │                           │
                    │ • PDF/CSV Extraction      │
                    │ • Data Cleaning            │
                    │ • Missing Value Handling  │
                    │ • Feature Engineering     │
                    │ • Expense Categorization │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │     SECURITY LAYER 🔐     │
                    │                           │
                    │ • Authentication          │
                    │ • Password Hashing         │
                    │ • Encryption              │
                    │ • Data Minimization       │
                    │ • User Data Isolation     │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
              ┌───────────────────┴──────────────────┐
              │                                      │
              ▼                                      ▼
   ┌──────────────────────┐              ┌──────────────────────┐
   │    DATABASE 🗄️       │              │     ML ENGINE 🧠     │
   │                      │              │                      │
   │ PostgreSQL           │              │ Expense Category     │
   │ Transactions         │              │ Spending Prediction  │
   │ Budgets              │              │ Anomaly Detection    │
   │ Savings Goals        │              │ Financial Score      │
   └──────────┬───────────┘              └──────────┬───────────┘
              │                                     │
              └─────────────────┬───────────────────┘
                                ▼
                    ┌───────────────────────────┐
                    │       AI ENGINE 🤖        │
                    │                           │
                    │       Gemini API          │
                    │                           │
                    │ • Financial Chatbot       │
                    │ • Explain ML Results      │
                    │ • Generate Insights       │
                    │ • Personalized Guidance   │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │       DASHBOARD 📊        │
                    │                           │
                    │ • Income                  │
                    │ • Expenses                │
                    │ • Spending Charts         │
                    │ • Budget                  │
                    │ • Savings Progress        │
                    │ • AI Insights             │
                    │ • Financial Health Score  │
                    └───────────────────────────┘
```

---

# 🔧 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Data Processing | Pandas, NumPy |
| Machine Learning | Scikit-learn |
| Generative AI | Gemini API |
| Visualization | Recharts / Chart.js |
| Statement Processing | PDF/CSV parsing |
| Authentication | JWT |
| Password Security | bcrypt / Argon2 |
| Deployment | Vercel + Render/Railway |

---

# 📊 Data Sources

Spendwise AI uses two different types of financial data.

## 1. Public/Kaggle Datasets — Model Training

Public financial datasets can be used to train and evaluate ML models.

Possible datasets include:

- Indian Personal Finance & Spending Habits
- Financial Transactions Dataset
- Personal Finance Dataset
- BudgetWise Personal Finance Dataset
- Synthetic Indian Financial Transactions

These datasets are used for **model development, testing, and evaluation**, not as a source of real user banking credentials.

## 2. User Financial Data — Application Usage

The application can receive user data through:

### Manual Entry

```text
Amount: ₹350
Category: Food
Payment: UPI
Date: 15/09/2026
```

### Statement Upload

The user may upload an exported **PDF/CSV bank or payment statement**, where supported.

The application extracts useful transaction information such as:

```text
Date
Merchant
Amount
Debit/Credit
Payment Method
Category
```

Spendwise AI does **not** directly request a user's Google Pay password, UPI PIN, OTP, bank password, or card CVV.

---

# 🧠 Machine Learning Components

For a college-level implementation, Spendwise AI focuses on three major ML tasks.

## 1. Expense Categorization

Automatically predicts the category of a transaction.

**Example:**

```text
"Swiggy ₹450"
       ↓
ML Model
       ↓
Food
```

Possible algorithms:

- Logistic Regression
- Random Forest
- Decision Tree

---

## 2. Expense Prediction

Uses historical spending to estimate future expenses.

```text
January   → ₹15,000
February  → ₹17,000
March     → ₹16,500
April     → ₹18,000
                ↓
          ML Prediction
                ↓
May       → Estimated Expense
```

Possible approaches:

- Linear Regression
- Random Forest Regression
- Time-Series methods

---

## 3. Anomaly Detection

Identifies unusual spending patterns.

```text
Normal Shopping:
₹500 – ₹2,000

Sudden Transaction:
₹15,000

        ↓

⚠️ Unusual Spending Detected
```

Possible algorithm:

**Isolation Forest**

---

# 🤖 Generative AI Layer

Machine Learning performs the numerical analysis, while Generative AI makes the results understandable to the user.

```text
Transaction Data
       ↓
ML Analysis
       ↓
"Shopping increased by 32%"
       ↓
Gemini
       ↓
Natural-Language Explanation
       ↓
Personalized Recommendation
```

### Example

**ML Output:**

```text
Food spending:
Current month = ₹4,250
Previous month = ₹3,100
Increase = 37.1%
```

**AI Output:**

> Your food spending increased significantly this month. Consider setting a food budget of ₹3,500–₹4,000 next month.

---

# 🔐 Data Security & Privacy

**Data security is a core part of Spendwise AI.**

## Sensitive information we DO NOT collect

- ❌ UPI PIN
- ❌ OTP
- ❌ Bank password
- ❌ Card CVV
- ❌ Full card number
- ❌ Payment authentication credentials

## Data Minimization

Only required financial information should be processed.

```text
Raw Statement
      ↓
Extract Required Fields
      ↓
Remove Unnecessary Sensitive Information
      ↓
Store Required Transaction Data
```

## AI Privacy Layer

Raw personal information should not be unnecessarily sent to the external AI model.

Instead of sending:

```text
Name
Account Number
Transaction Details
```

the AI can receive a minimized context such as:

```text
Monthly Income: ₹30,000
Food Spending: ₹4,250
Shopping Spending: ₹3,500
Savings: ₹11,600
```

This reduces unnecessary exposure of sensitive information.

## User Data Isolation

Each user's data is associated with their authenticated user ID.

```text
User A → User A Transactions Only
User B → User B Transactions Only
```

---

# 📱 Main Application Modules

1. **Authentication**
2. **Dashboard**
3. **Transaction Management**
4. **Statement Upload**
5. **Expense Categorization**
6. **Spending Analytics**
7. **Budget Planner**
8. **Savings Goals**
9. **Expense Prediction**
10. **Anomaly Detection**
11. **Financial Health Score**
12. **AI Financial Assistant**
13. **Security & Privacy**

---

# 📊 Proposed Dashboard

```text
┌──────────────────────────────────────────┐
│             FINANCIAL DASHBOARD          │
├──────────────────────────────────────────┤
│ Income             ₹30,000               │
│ Expenses           ₹18,400               │
│ Savings            ₹11,600               │
│ Financial Score    78 / 100              │
├──────────────────────────────────────────┤
│ Top Spending Categories                  │
│                                          │
│ Food             ₹4,200                  │
│ Shopping         ₹3,500                  │
│ Transport        ₹2,100                  │
│ Entertainment    ₹1,800                  │
├──────────────────────────────────────────┤
│ 🤖 AI Insight                            │
│                                          │
│ "Your shopping expenses increased by     │
│ 32% compared with last month."           │
└──────────────────────────────────────────┘
```

---

# 📁 Project Structure

```text
Spendwise AI/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── main.py
│   ├── routes/
│   ├── models/
│   ├── services/
│   └── database/
│
├── ml/
│   ├── data/
│   ├── notebooks/
│   ├── preprocessing/
│   ├── models/
│   └── predictions/
│
├── ai/
│   ├── prompts/
│   └── assistant.py
│
├── uploads/
│
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/spendwise-ai.git
cd spendwise-ai
```

## 2. Create Python Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scriptsctivate
```

### macOS/Linux

```bash
source venv/bin/activate
```

## 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

## 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## 5. Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_database_url
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret_key
```

**Never commit `.env` to GitHub.**

## 6. Run Backend

```bash
uvicorn backend.main:app --reload
```

## 7. Run Frontend

```bash
cd frontend
npm run dev
```

---

# 🔄 Complete Data Flow

```text
User
 ↓
Manual Entry / Statement Upload
 ↓
PDF/CSV Extraction
 ↓
Data Cleaning
 ↓
Feature Engineering
 ↓
Security & Data Minimization
 ↓
Encrypted Database
 ↓
ML Models
 ├── Expense Categorization
 ├── Expense Prediction
 └── Anomaly Detection
 ↓
Financial Analysis
 ↓
AI Explanation & Recommendations
 ↓
Dashboard
 ↓
User
```

---

# 🎯 Project Objectives

- Develop an intelligent personal finance management system
- Automate expense categorization
- Analyze spending behaviour
- Predict future expenses
- Detect unusual transactions
- Help users create realistic budgets
- Track savings goals
- Provide conversational AI-based financial insights
- Minimize exposure of sensitive financial information

---

# 🌟 Unique Selling Proposition

## **"A Privacy-First AI Financial Coach"**

Unlike a traditional expense tracker, Spendwise AI combines:

**Personal Finance + Machine Learning + Generative AI + Data Security**

The system does not simply show users their spending. It analyzes their financial behaviour and provides understandable, personalized actions while following a **data-minimization approach**.

---

# 🏆 Why This Project Is Suitable for a College Project

Spendwise AI demonstrates multiple important concepts from AI & Data Science:

- Data collection
- Data preprocessing
- Exploratory Data Analysis
- Feature engineering
- Classification
- Regression
- Anomaly detection
- Generative AI
- Database management
- Backend API development
- Frontend development
- Authentication
- Data security
- Data visualization

The project is also modular, allowing the team to implement a basic version first and add advanced features later.

---

# 🔮 Future Scope

- Secure financial-data integrations
- Automatic statement synchronization
- OCR-based receipt scanning
- Voice-based financial assistant
- Subscription detection
- Advanced financial forecasting
- Multi-language support
- Mobile application
- Explainable AI
- Personalized financial planning
- Advanced investment insights

---

# ⚠️ Disclaimer

Spendwise AI is an educational/project application. Its AI-generated insights are for informational purposes only and should not be considered professional financial, investment, tax, or legal advice.

---

## 💙 Spendwise AI

### **See your money. Understand your future.**
  