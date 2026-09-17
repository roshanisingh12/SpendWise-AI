# Spendwise AI API Documentation

**Base URL**: `http://localhost:5000/api`

## Authentication

All protected endpoints require a valid JWT token sent in the `Authorization` header:
`Authorization: Bearer <your_token>`

### Register
- **Method**: `POST /auth/register`
- **Auth Required**: No
- **Body**: `{ "name": "User", "email": "user@example.com", "password": "Password123" }`
- **Response**: `{ "success": true, "data": { "user": { ... }, "token": "..." } }`

### Login
- **Method**: `POST /auth/login`
- **Auth Required**: No
- **Body**: `{ "email": "user@example.com", "password": "Password123" }`
- **Response**: `{ "success": true, "data": { "user": { ... }, "token": "..." } }`

### Get Current User
- **Method**: `GET /auth/me`
- **Auth Required**: Yes
- **Response**: `{ "success": true, "data": { "user": { ... } } }`

### Logout
- **Method**: `POST /auth/logout`
- **Auth Required**: Yes
- **Response**: `{ "success": true, "message": "Logged out successfully." }`

## Transactions

### List Transactions
- **Method**: `GET /transactions`
- **Auth Required**: Yes
- **Query Params**: `page`, `limit`, `type`, `categoryId`, `startDate`, `endDate`
- **Response**: `{ "success": true, "data": { "data": [...], "total": 10, "page": 1, "totalPages": 1 } }`

### Create Transaction
- **Method**: `POST /transactions`
- **Auth Required**: Yes
- **Body**: `{ "type": "EXPENSE", "amount": 100, "categoryId": "...", "date": "2026-09-17" }`
- **Response**: `{ "success": true, "data": { "transaction": { ... } } }`

### Get Transaction
- **Method**: `GET /transactions/:id`
- **Auth Required**: Yes

### Update Transaction
- **Method**: `PATCH /transactions/:id`
- **Auth Required**: Yes
- **Body**: `{ "amount": 150 }` (Partial updates supported)

### Delete Transaction
- **Method**: `DELETE /transactions/:id`
- **Auth Required**: Yes

## Budgets

### List Budgets
- **Method**: `GET /budgets`
- **Auth Required**: Yes

### Create Budget
- **Method**: `POST /budgets`
- **Auth Required**: Yes
- **Body**: `{ "categoryId": "...", "amount": 500, "period": "MONTHLY", "startDate": "2026-09-01" }`

### Update Budget
- **Method**: `PATCH /budgets/:id`
- **Auth Required**: Yes

### Delete Budget
- **Method**: `DELETE /budgets/:id`
- **Auth Required**: Yes

## Categories

### List Categories
- **Method**: `GET /categories`
- **Auth Required**: Yes

### Create Category
- **Method**: `POST /categories`
- **Auth Required**: Yes
- **Body**: `{ "name": "Food", "type": "EXPENSE", "color": "#FF0000" }`

### Update Category
- **Method**: `PATCH /categories/:id`
- **Auth Required**: Yes

### Delete Category
- **Method**: `DELETE /categories/:id`
- **Auth Required**: Yes

## Savings Goals

### List Savings Goals
- **Method**: `GET /savings-goals`
- **Auth Required**: Yes

### Create Savings Goal
- **Method**: `POST /savings-goals`
- **Auth Required**: Yes
- **Body**: `{ "name": "Emergency Fund", "targetAmount": 10000 }`

### Update Savings Goal
- **Method**: `PATCH /savings-goals/:id`
- **Auth Required**: Yes

### Delete Savings Goal
- **Method**: `DELETE /savings-goals/:id`
- **Auth Required**: Yes

## Analytics

- **GET `/analytics/summary`**: Returns total income, expenses, balance, and transaction count. (Query: `year`, `month`)
- **GET `/analytics/monthly`**: Returns month-by-month trends. (Query: `months`)
- **GET `/analytics/categories`**: Returns spending breakdown by category. (Query: `startDate`, `endDate`)
- **GET `/analytics/budget-progress`**: Returns actual spending vs target for all budgets.
- **GET `/analytics/savings-progress`**: Returns progress towards savings goals.

## Notifications

- **GET `/notifications`**: List all notifications.
- **PATCH `/notifications/:id/read`**: Mark as read.
- **DELETE `/notifications/:id`**: Delete notification.

## Insights (Foundation)

- **GET `/insights`**: List all financial insights.
- **GET `/insights/:id`**: Get specific insight.
- **DELETE `/insights/:id`**: Delete insight.
