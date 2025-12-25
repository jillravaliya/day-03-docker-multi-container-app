
# DAY 3 — Multi-Container Application (The Rebuild)

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.19.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Container-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

-----

## The Truth About My First Version

I already built this project once.

With AI’s help, everything worked perfectly:

- Clean Dockerfiles
- Perfect network setup
- Beautiful README

But when someone asked me to explain how it worked, I froze.

“Just run the commands,” I said, pointing at the README.

But I couldn’t run it myself from scratch. I couldn’t explain why the network needed to be created first. I couldn’t debug when something broke.

**I understood it theoretically, but not practically.**

That’s when I realized: **Having a working project and understanding how to build it are two completely different things.**

So today, I deleted everything and started over.

No AI writing my Dockerfiles. No copying commands without understanding them.

This is the story of building it the second time — and finally understanding what I’m actually doing.

-----

## What I Thought vs What I Learned

### **What I Thought (After First Version):**

- I understand Docker multi-container apps
- I know how networking works
- I can build this project

### **What I Actually Learned (After Rebuilding):**

- Knowing theory ≠ being able to build it
- Order matters (network first, then containers)
- Every flag has a purpose (`--name`, `--network`)
- Mistakes teach you more than perfect code

**The first version looked perfect in the README. This version has mistakes documented.**

**But this version is mine.**

-----

## What I Built

A simple **Image to PDF Converter** with:

- **Backend:** Node.js + Express (handles image upload and PDF conversion)
- **Frontend:** React + Vite (file upload UI)
- Two separate containers communicating over a Docker network

**Architecture:**

```
Frontend (React + Vite)          Backend (Node.js + Express)
Port: 8081 → 5173               Port: 8080 → 3000
        |                               |
        |  POST /convert (image file)   |
        └──────────────────────────────>|
                                        |
                                   PDF created
                                        |
        <───────────────────────────────┘
              Download PDF
```

Both containers connected via `app-network`.

-----

## The Journey — Step by Step

-----

### **Step 1: Setting Up the Project Structure**

I created two separate folders for backend and frontend.

```bash
mkdir day-03-docker-multi-container-app
cd day-03-docker-multi-container-app
mkdir Backend Frontend
```

**Backend structure:**

- `app.js` — Express server with `/convert` endpoint
- `package.json` — Dependencies (express, multer, pdfkit)
- `Dockerfile` — Container definition

**Frontend structure:**

- `src/App.jsx` — React component with file upload
- `package.json` — Dependencies (react, vite)
- `vite.config.mjs` — Vite configuration
- `Dockerfile` — Container definition

I wrote all the application code first before touching Docker.

-----

### **Step 2: Building the Backend Dockerfile (First Mistake)**

I started with the backend because it’s simpler — just a Node.js API server.

**My first Dockerfile:**

```dockerfile
FROM node:20-slim
WORKDIR /app
RUN npm install
COPY . .
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["app.js"]
```

![Backend Dockerfile](screenshots/Backend%20dockerfile.png)

**Built the image:**

```bash
cd Backend
docker build -t day-03-backend .
```

**What I expected:** Image builds successfully.

**What actually happened:** **Build failed**

```
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /app/package.json
npm ERR! errno -2
npm ERR! enoent ENOENT: no such file or directory, open '/app/package.json'
```

**I stared at this error for a full minute.**

Why is `package.json` missing? It’s right there in my folder.

**Then it hit me:**

I put `RUN npm install` **before** `COPY . .`

Docker tries to install packages, but the files aren’t in the container yet. There’s no `package.json` to read.

**This is exactly what I learned on Day 2:** Instruction order matters.

**The fix:**

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["app.js"]
```

**Now COPY comes before RUN.** Files are in the container, then npm can install.

-----

### **Second Mistake: CMD Syntax**

After fixing the order, I built again:

```bash
docker build -t day-03-backend .
```

![Backend Image Build](screenshots/Backend%20image%20build.png)

**Build succeeded!** 

Now I ran the container:

```bash
docker run -p 8080:3000 day-03-backend
```

![Backend Image Run](screenshots/Backend%20image%20run.png)

**What I expected:** Backend starts on port 3000.

**What actually happened:** **Error**

```
node: bad option: app.js
```

**I was confused.** The file exists. Why is it a “bad option”?

Then I remembered from Day 2: `CMD` needs proper array format.

I had written:

```dockerfile
CMD ["app.js"]
```

But `ENTRYPOINT ["node"]` means Docker executes:

```bash
node app.js
```

That works. So what’s wrong?

**Oh wait.** I had initially tried:

```dockerfile
CMD ["run dev"]
```

That’s the actual mistake. `["run dev"]` is ONE string, not two arguments.

**Correct format:**

```dockerfile
CMD ["run", "dev"]
```

But for this backend, I don’t need `run dev`. I just need:

```dockerfile
ENTRYPOINT ["node"]
CMD ["app.js"]
```

**Fixed Dockerfile:**

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["app.js"]
```

**Rebuilt and ran:**

```bash
docker build -t day-03-backend .
docker run -p 8080:3000 day-03-backend
```

![Backend Running](screenshots/Backend%20running.png)

**Output:**

```
Backend listening on port 3000
```

**It worked!** 

-----

### **Step 3: Testing the Backend**

Before moving to frontend, I wanted to confirm the backend actually works.

**Opened another terminal and tested:**

```bash
curl http://localhost:8080/
```

![Backend Running Confirmation](screenshots/Backend%20running%20confirmation.png)

**Output:**

```
Backend is running 
```

**Perfect.** The backend is alive and responding.

-----

### **Step 4: Building the Frontend Dockerfile**

Now for the frontend. React + Vite.

After struggling with the backend, I was more careful with the order.

**Created the files:**

```bash
cd ../Frontend
touch index.html package.json vite.config.mjs
mkdir src
cd src
touch main.jsx App.jsx
```

![Frontend File Create](screenshots/Frontend%20file%20create.png)

**Frontend Dockerfile:**

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5173
ENTRYPOINT ["npm"]
CMD ["run", "dev"]
```

![Frontend Dockerfile](screenshots/Frontend%20dockerfile.png)

**Key differences from backend:**

- `EXPOSE 5173` (Vite’s default port)
- `CMD ["run", "dev"]` (runs Vite dev server)

**This time I got the order right:**

1. `COPY` first (bring files in)
1. `RUN npm install` (install dependencies)
1. `ENTRYPOINT` and `CMD` (define startup command)

**Built the image:**

```bash
docker build -t day-03-frontend .
```

![Frontend Image Build](screenshots/Frontend%20image%20build.png)

**Build succeeded!** No mistakes this time.

**Ran the container:**

```bash
docker run -p 8081:5173 day-03-frontend
```

![Frontend Image Run](screenshots/Frontend%20image%20run.png)

**Output:**

```
> frontend@1.0.0 dev
> vite --host

VITE v5.4.21  ready in 167 ms

➜  Local:   http://localhost:5173/
➜  Network: http://172.17.0.3:5173/
```

**It worked!** 

![Frontend Running](screenshots/Frontend%20running.png)

I opened `http://localhost:8081` in my browser and saw the React UI.

-----

### **Step 5: The Big Mistake — Containers Can’t Talk**

Both containers were running:

- Backend on `localhost:8080`
- Frontend on `localhost:8081`

I clicked the “Convert to PDF” button in the frontend.

**Nothing happened.**

I opened the browser console:

```
Failed to fetch: http://localhost:3000/convert
```

**Wait, what?**

The frontend is trying to reach `localhost:3000`, but the backend is on `localhost:8080`.

**Oh, I see the issue.** Inside the frontend code (`App.jsx`), I hardcoded:

```javascript
fetch("http://localhost:3000/convert")
```

But that’s wrong. From the browser, I’m accessing:

- Frontend: `localhost:8081`
- Backend: `localhost:8080`

**Then I realized something bigger:**

Even if I fix the port, this won’t work. The frontend and backend are in **separate containers**. They can’t reach each other using `localhost`.

**This is when it hit me:**

On Day 1, I learned about Docker networks. Containers need to be on the same network to communicate by name.

**But I never created a network.**

I just ran the containers with `-p` flags. They’re isolated.

-----

### **Step 6: Creating the Network (Too Late)**

I should have done this **before** running any containers. But I didn’t.

Now I had to fix it.

**Created the network:**

```bash
docker network create app-network
```

![Network Create](screenshots/network%20create.png)

**Checked existing containers:**

```bash
docker ps
```

**Output:**

```
CONTAINER ID   IMAGE              COMMAND           PORTS                    NAMES
4b60b32cac0b   day-03-frontend    "npm run dev"     0.0.0.0:8081->5173/tcp   agitated_feynman
907a0b26bbd6   day-03-backend     "node app.js"     0.0.0.0:8080->3000/tcp   epic_khorana
```

**Notice the names:** `agitated_feynman` and `epic_khorana`

These are **Docker’s random names** because I forgot to use `--name` when I ran the containers.

**What I should have done:**

```bash
docker run -p 8080:3000 --name backend --network app-network day-03-backend
docker run -p 8081:5173 --name frontend --network app-network day-03-frontend
```

**But I didn’t.** So now I have to connect the existing containers to the network.

-----

### **Step 7: Connecting Containers to the Network**

```bash
docker network connect app-network epic_khorana
docker network connect app-network agitated_feynman
```

![Network Connect](screenshots/network%20connect.png)

**Verified the connection:**

```bash
docker network inspect app-network
```

**Output:**

```json
"Containers": {
    "4b60b32cac0b": {
        "Name": "agitated_feynman",
        "IPv4Address": "172.18.0.3/16"
    },
    "907a0b26bbd6": {
        "Name": "epic_khorana",
        "IPv4Address": "172.18.0.2/16"
    }
}
```

**Both containers are now on the same network.**

-----

### **Step 8: Fixing the Frontend to Use Container Name**

Now I needed to change the frontend code to use the backend’s **container name** instead of `localhost`.

**Updated `App.jsx`:**

```javascript
// Before
fetch("http://localhost:3000/convert")

// After
fetch("http://epic_khorana:3000/convert")
```

**But wait.** That’s ugly. I should have named it `backend`.

**Lesson learned:** Always use `--name` when running containers.

**Rebuilt the frontend:**

```bash
docker build -t day-03-frontend .
```

**Stopped the old container:**

```bash
docker stop agitated_feynman
docker rm agitated_feynman
```

**Ran with proper name this time:**

```bash
docker run -p 8081:5173 --name frontend --network app-network day-03-frontend
```

**Updated the code to:**

```javascript
fetch("http://backend:3000/convert")
```

**But the backend container is still called `epic_khorana`.**

**Stopped and recreated backend with proper name:**

```bash
docker stop epic_khorana
docker rm epic_khorana
docker run -p 8080:3000 --name backend --network app-network day-03-backend
```

**Now both containers have clean names:**

- `backend`
- `frontend`

**And the frontend can reach the backend using:**

```javascript
fetch("http://backend:3000/convert")
```

-----

### **Step 9: Final Test**

I opened `http://localhost:8081` in my browser.

Clicked “Choose file” → selected an image → clicked “Convert to PDF”.

**The download prompt appeared.** 

**It worked!**

The frontend successfully sent the image to the backend, the backend converted it to PDF, and returned it to the browser.

**Everything was finally connected.**

-----

## What I Actually Learned

### **1. Theory ≠ Practice**

The first time I built this project with AI help, I understood the **concepts**:

- Dockerfiles define containers
- Networks connect containers
- Port mapping exposes services

But I couldn’t **execute** it. I didn’t know:

- Why `COPY` must come before `RUN`
- Why `CMD` needs array format
- Why you create the network **first**

**Understanding concepts and being able to build something are completely different skills.**

-----

### **2. Order Matters (Everywhere)**

**In Dockerfiles:**

```dockerfile
# Wrong
RUN npm install  # Fails (no files yet)
COPY . .

# Right
COPY . .         # Files copied first
RUN npm install  # Now can install
```

**In Setup:**

```bash
# Wrong
docker run backend    # Containers isolated
docker run frontend
docker network create # Too late

# Right
docker network create app-network        # Network first
docker run --network app-network backend # Connected from start
docker run --network app-network frontend
```

**Everything has a sequence. Skip a step or do it in the wrong order, and things break.**

-----

### **3. Flags Matter**

When I ran containers without flags:

```bash
docker run -p 8080:3000 day-03-backend
```

I got:

- Random name (`epic_khorana`)
- No network connection
- Had to fix it manually later

**What I should have done:**

```bash
docker run -p 8080:3000 --name backend --network app-network day-03-backend
```

**Every flag has a purpose:**

- `-p 8080:3000` → Port mapping (host:container)
- `--name backend` → Predictable container name
- `--network app-network` → Connect to network

**Leaving them out doesn’t throw an error, but it makes everything harder later.**

-----

### **4. Container Names Matter**

When I used Docker’s random names, my frontend code looked like:

```javascript
fetch("http://epic_khorana:3000/convert")
```

That works, but it’s:

- Ugly
- Not portable (name changes every time)
- Hard to debug

**With proper names:**

```javascript
fetch("http://backend:3000/convert")
```

Clean, clear, predictable.

-----

### **5. Localhost Doesn’t Work Between Containers**

This was a big mental shift.

On my laptop:

- Frontend: `localhost:8081`
- Backend: `localhost:8080`

**But inside containers:**

- `localhost` = the container itself
- Containers are isolated by default
- They need a network to communicate

**Docker provides DNS resolution:**

When containers are on the same network, you can use **container names** instead of IP addresses.

```javascript
fetch("http://backend:3000")  //  Works (container name)
fetch("http://localhost:3000") //  Doesn't work (isolated)
```

-----

### **6. Mistakes Teach More Than Perfect Code**

My first version (with AI) had:

- Perfect Dockerfiles
- Perfect commands
- Perfect README

But I learned almost nothing.

This version has:

- `RUN` before `COPY` mistake
- `CMD` syntax error
- Network created too late
- Random container names

**And I learned 10x more.**

**Because debugging forces you to understand what’s actually happening.**

-----

## The Difference Between Two Versions

|First Version (AI-Assisted)|Second Version (Self-Built)|
|---------------------------|---------------------------|
|Perfect code               |Had mistakes               |
|Everything worked          |Had to debug               |
|Clean README               |This README                |
|Couldn’t explain it        |Can explain every step     |
|Couldn’t run it myself     |Can build it from scratch  |
|Understood theory          |Understand practice        |

**The first version looked perfect in the README.**

**This version has mistakes documented.**

**But this version is mine. I can run it. I can explain it. I can fix it when it breaks.**

**That’s the difference.**

-----

## My Failed Docker Setup (Before Fixing)

### **Initial Run Commands (Wrong Order):**

```bash
# Built images
docker build -t day-03-backend Backend/
docker build -t day-03-frontend Frontend/

# Ran containers WITHOUT network setup
docker run -p 8080:3000 day-03-backend    # No --name, no --network
docker run -p 8081:5173 day-03-frontend   # No --name, no --network

# Result: Containers can't communicate
```

### **What I Should Have Done:**

```bash
# Create network FIRST
docker network create app-network

# Run containers with proper names and network
docker run -d -p 8080:3000 --name backend --network app-network day-03-backend
docker run -d -p 8081:5173 --name frontend --network app-network day-03-frontend

# Result: Containers connected from the start
```

-----

## Final Working Setup

### **1. Create Network:**

```bash
docker network create app-network
```

### **2. Build Images:**

```bash
docker build -t day-03-backend Backend/
docker build -t day-03-frontend Frontend/
```

### **3. Run Backend:**

```bash
docker run -d -p 8080:3000 --name backend --network app-network day-03-backend
```

### **4. Run Frontend:**

```bash
docker run -d -p 8081:5173 --name frontend --network app-network day-03-frontend
```

### **5. Access:**

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8080`

-----

## Tech Stack

- **Backend:** Node.js 20, Express 4.19.2, Multer 1.4.5, PDFKit 0.15.0
- **Frontend:** React 18.2.0, Vite 5.4.21
- **Containerization:** Docker
- **Networking:** Docker Bridge Network

-----

## Connect With Me

I’m actively learning Docker, Kubernetes, and cloud infrastructure — documenting every step of the journey.

- Email: **jillahir9999@gmail.com**
- LinkedIn: [linkedin.com/in/jill-ravaliya-684a98264](https://linkedin.com/in/jill-ravaliya-684a98264)
- GitHub: [github.com/jillravaliya](https://github.com/jillravaliya)

**Open to:**

- DevOps & Cloud Infrastructure roles
- Mentorship & collaboration
- Professional networking

-----

### If this helped you understand multi-container Docker apps, give it a star!

-----

*Day 3 complete. Built it twice. Understood it once.*
