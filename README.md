# AI Dev Hub - Backend Documentation (Portfolio Level)

---

## 🧠 Overview

AI Dev Hub backend is a hybrid architecture:

* **Node.js + Express** → API layer
* **PostgreSQL** → Users, Projects, RBAC
* **MongoDB** → Documents (flexible content)
* **JWT Authentication**
* **RBAC (Role-Based Access Control)**

---

# 📁 Project Structure

```
src/
  controllers/
    authController.js
    projectController.js
    documentController.js
  routes/
    authRoutes.js
    projectRoutes.js
    documentRoutes.js
  middleware/
    authMiddleware.js
    rbacMiddleware.js
  models/
    Document.js
  config/
    postgres.js
  server.js
```

---

# 🔐 Authentication

## Headers (for protected routes)

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## POST /api/auth/signup

### Request

```json
{
  "email": "user@test.com",
  "password": "123456"
}
```

### Response (201)

```json
{
  "id": 1,
  "email": "user@test.com"
}
```

---

## POST /api/auth/login

### Request

```json
{
  "email": "user@test.com",
  "password": "123456"
}
```

### Response (200)

```json
{
  "token": "JWT_TOKEN"
}
```

---

# 🧑‍💻 Projects API

## RBAC Rules

| Endpoint            | Owner | Editor | Viewer |
| ------------------- | ----- | ------ | ------ |
| Create Project      | ✅     | ❌      | ❌      |
| Get Projects        | ✅     | ✅      | ✅      |
| Get Project Details | ✅     | ✅      | ✅      |
| Add Member          | ✅     | ❌      | ❌      |
| Update Role         | ✅     | ❌      | ❌      |

---

## POST /api/projects

### Headers

```
Authorization: Bearer TOKEN
```

### Body

```json
{
  "name": "AI Dev Hub",
  "description": "Main project"
}
```

### Response (201)

```json
{
  "id": 1,
  "name": "AI Dev Hub",
  "description": "Main project"
}
```

---

## GET /api/projects

### Response (200)

```json
[
  {
    "id": 1,
    "name": "AI Dev Hub"
  }
]
```

---

## GET /api/projects/:id/details

### Response (200)

```json
{
  "project": {
    "id": 1,
    "name": "AI Dev Hub"
  },
  "documents": [
    {
      "_id": "abc",
      "title": "Doc 1"
    }
  ]
}
```

---

## POST /api/projects/:projectId/members

### Body

```json
{
  "email": "userB@test.com",
  "role": "viewer"
}
```

### Response

```json
{
  "message": "User added to project"
}
```

---

## PATCH /api/projects/:projectId/members

### Body

```json
{
  "email": "userB@test.com",
  "role": "editor"
}
```

---

# 📄 Documents API

## RBAC Rules

| Endpoint        | Owner | Editor | Viewer |
| --------------- | ----- | ------ | ------ |
| Create Document | ✅     | ✅      | ❌      |
| Get Documents   | ✅     | ✅      | ✅      |
| Update Document | ✅     | ✅      | ❌      |

---

## POST /api/documents

### Headers

```
Authorization: Bearer TOKEN
```

### Body

```json
{
  "title": "Doc 1",
  "content": "Hello",
  "projectId": "1"
}
```

### Response (201)

```json
{
  "_id": "abc123",
  "title": "Doc 1"
}
```

---

## GET /api/documents/project/:projectId

### Response (200)

```json
[
  {
    "_id": "abc",
    "title": "Doc 1"
  }
]
```

---

## PATCH /api/documents/:id

### Body

```json
{
  "title": "Updated"
}
```

---

# 🗄️ Database Schema

## PostgreSQL

### users

```sql
id SERIAL PRIMARY KEY
email VARCHAR UNIQUE
password VARCHAR
created_at TIMESTAMP
```

---

### projects

```sql
id SERIAL PRIMARY KEY
name VARCHAR(255)
description TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

### project_members

```sql
id SERIAL PRIMARY KEY
project_id INTEGER REFERENCES projects(id)
user_id INTEGER REFERENCES users(id)
role VARCHAR(20)
created_at TIMESTAMP
UNIQUE(project_id, user_id)
```

---

## MongoDB

### Document

```js
{
  title: String,
  content: String,
  projectId: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

# 🔐 Middleware

## Auth Middleware

* Validates JWT
* Attaches `req.user`

---

## RBAC Middleware

* Fetches user role from DB
* Compares against allowed roles

---

# 🔄 Data Flow

```
Client → API Request → Auth Middleware → RBAC Middleware → Controller → Database → Response
```

---

# ⚠️ Error Handling

## Common Errors

```json
{
  "error": "No token provided"
}
```

```json
{
  "error": "Invalid token"
}
```

```json
{
  "error": "Insufficient permissions"
}
```

```json
{
  "error": "Project not found"
}
```

---

# ⚙️ Environment Variables

```env
PORT=5000
MONGO_URI=your_mongodb_uri
DATABASE_URL=your_postgres_uri
JWT_SECRET=your_secret_key
```

---

# 🧪 Testing Flow (Postman)

1. Signup user
2. Login → get token
3. Create project
4. Add member
5. Create document
6. Test role restrictions

---

# 🚀 Final Status

✅ Authentication (JWT)
✅ Protected Routes
✅ RBAC (Owner/Editor/Viewer)
✅ Hybrid Database Design
✅ Multi-user Collaboration

