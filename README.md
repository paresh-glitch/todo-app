# 📝 Todo App — Docker + ECS + ECR

A full-stack Todo app with **React + Nginx + Node.js + MongoDB**, built for AWS ECS Fargate.

---

## 📁 Project Structure

```
todo-app/
├── backend/
│   ├── models/
│   │   └── Todo.js          ← MongoDB schema (shape of a todo)
│   ├── routes/
│   │   └── todos.js         ← CRUD API routes (GET, POST, PUT, DELETE)
│   ├── server.js            ← Express app entry point
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js           ← Main React UI
│   │   └── index.js
│   ├── nginx.conf           ← Nginx: serves React + proxies /api to backend
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml       ← Local testing
├── task-definition.json     ← ECS Fargate deployment
└── README.md
```

---

## 🧠 How the Code Works (Express Explained Simply)

### The API has 4 routes — one for each CRUD operation:

| Method | URL | What it does |
|--------|-----|--------------|
| GET | `/api/todos` | Fetch all todos from MongoDB |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Toggle a todo as done/undone |
| DELETE | `/api/todos/:id` | Delete a todo |

### How a request flows:
```
Browser (React)
  → clicks "Add Todo"
  → calls POST /api/todos
  → Nginx receives it (port 80)
  → Nginx proxies to backend (127.0.0.1:5000)
  → Express saves to MongoDB (127.0.0.1:27017)
  → Returns the saved todo as JSON
  → React updates the UI
```

### Why 127.0.0.1 in ECS?
In ECS, all containers in the same Task share the same network namespace.
So they talk to each other via `127.0.0.1` (localhost) — NOT by service name.
Service names like `mongodb` only work in Docker Compose.

---

## 🖥️ Step 1 — Test Locally with Docker Compose

```bash
# Build and start all 3 containers
docker compose up --build

# Open in browser
http://localhost:3000

# Stop everything
docker compose down
```

---

## 🏗️ Step 2 — Create ECR Repositories

Run these in AWS CLI (once):

```bash
# Create a repo for each image
aws ecr create-repository --repository-name todo-mongodb --region ap-south-1
aws ecr create-repository --repository-name todo-backend  --region ap-south-1
aws ecr create-repository --repository-name todo-frontend --region ap-south-1
```

---

## 🔐 Step 3 — Login to ECR

```bash
aws ecr get-login-password --region ap-south-1 \
  | docker login --username AWS \
    --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
```

Replace `YOUR_ACCOUNT_ID` with your actual AWS account ID (12 digits).

---

## 📦 Step 4 — Build & Push Images to ECR

### MongoDB (use official image, just re-tag it)
```bash
docker pull mongo:6
docker tag mongo:6 YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/todo-mongodb:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/todo-mongodb:latest
```

### Backend
```bash
docker build -t todo-backend ./backend
docker tag todo-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/todo-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/todo-backend:latest
```

### Frontend
```bash
docker build -t todo-frontend ./frontend
docker tag todo-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/todo-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/todo-frontend:latest
```

---

## ☁️ Step 5 — Create CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /ecs/todo-app --region ap-south-1
```

---

## 📋 Step 6 — Register ECS Task Definition

1. Open `task-definition.json`
2. Replace ALL occurrences of `YOUR_ACCOUNT_ID` with your actual AWS account ID
3. Register it:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region ap-south-1
```

---

## 🚀 Step 7 — Create ECS Cluster & Service

### Create cluster
```bash
aws ecs create-cluster --cluster-name todo-cluster --region ap-south-1
```

### Create service
```bash
aws ecs create-service \
  --cluster todo-cluster \
  --service-name todo-service \
  --task-definition todo-app \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[YOUR_SUBNET_ID],
    securityGroups=[YOUR_SG_ID],
    assignPublicIp=ENABLED
  }" \
  --region ap-south-1
```

### Security Group rules needed:
| Type | Port | Source |
|------|------|--------|
| Inbound | 80 | 0.0.0.0/0 (public access) |
| Outbound | All | 0.0.0.0/0 |

---

## 🐛 Troubleshooting

### Container keeps restarting?
Check CloudWatch logs:
```bash
# In AWS Console → CloudWatch → Log groups → /ecs/todo-app
# OR via CLI:
aws logs tail /ecs/todo-app --follow --region ap-south-1
```

### Exit code 137?
→ Out of Memory! Increase `memory` in task-definition.json for that container.

### Exit code 1?
→ Application crash. Check the CloudWatch logs for error messages.

### Backend can't connect to MongoDB?
→ Make sure MONGO_URI is `mongodb://127.0.0.1:27017/tododb` (not `mongodb` or `localhost`)
→ Check that `dependsOn: HEALTHY` is set for backend → mongodb

### Nginx not proxying /api correctly?
→ Make sure nginx.conf only has a `server {}` block — no `events {}` or `http {}` wrappers

---

## 🔄 Updating the App (Deploy new version)

```bash
# 1. Rebuild and push the changed image
docker build -t todo-backend ./backend
docker tag todo-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/todo-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/todo-backend:latest

# 2. Force ECS to pull the new image
aws ecs update-service \
  --cluster todo-cluster \
  --service todo-service \
  --force-new-deployment \
  --region ap-south-1
```
