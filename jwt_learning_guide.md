# 🔐 JWT Security: Implementation & Learning Guide

This guide breaks down the security overhaul we just performed on the AMU Monitoring System. Use this as a reference to understand the "Why" and "How" behind professional-grade authentication.

---

## 🏗️ 1. The Core Architecture

In our system, security is split into two halves: **The Passport (JWT)** and **The Border Control (Middleware)**.

### The Passport (JWT)
- **What it is**: A signed JSON object. It doesn't just say "I am User X", it *proves* it because it's signed with a secret key only the backend knows.
- **Where it lives**: In your projectcheck_user_model, we store it in the browser's `localStorage` after a successful login.

### The Border Control (Middleware)
- **What it is**: A piece of code that runs **before** any view logic.
- **How it works**: It looks at every incoming request. If the "Passport" (JWT) is missing or fake, it stops the request immediately with a `401 Unauthorized` error.

---

## 🛠️ 2. How We Implemented It Here

### Step A: The Middleware (Backend)
Check [backend/amu_monitoring/middleware.py](backend/amu_monitoring/middleware.py).
- It extracts the token from the `Authorization: Bearer <token>` header.
- It decodes it using `jwt.decode()`.
- It sets `request.user` so you never have to pass `email` in a URL ever again.

### Step B: The Fetch Refactor (Frontend)
Check [frontend/src/pages/OperatorDashboard.jsx](frontend/src/pages/OperatorDashboard.jsx).
- We added an `authHeader`: `Bearer ${user.token}`.
- This "Passport" is now sent with every fetch call.

---

## 🚫 3. Why we removed Email Parameters
Previously, the system identified users via `?email=user@example.com`. 
- **The Risk**: Anyone could type a different email in the URL and see someone else's data (**IDOR vulnerability**).
- **The Fix**: Now, the system ignores the URL. It only trusts the **identity inside the JWT**. If the token says you are "User A", you can only see "User A"'s data, no matter what you type in the URL.

---

## 🛣️ 4. Your Recommended Learning Path

To become a professional SDE with a focus on architecture and security, follow this order:

1.  **HTTP Basics**: Understand how Headers, Body, and Status Codes (200, 401, 403, 500) work.
2.  **Stateless vs Stateful**: Learn the difference between Sessions (Cookies) and JWTs.
3.  **OWASP Top 10**: This is the "Bible" of web security. Focus on **Broken Access Control** and **Injection**.
4.  **Middleware Patterns**: Learn how to intercept requests in different frameworks (Express.js, Django, Spring Boot).
5.  **Environment Variable Management**: Learn how to keep secrets (like your JWT_SECRET) out of GitHub.

### 📚 Recommended Resources
- **[JWT.io](https://jwt.io)**: The best place to debug and understand token structure.
- **[MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)**: Great for understanding browser-side security.
- **[Roadmap.sh (Backend)](https://roadmap.sh/backend)**: Look specifically at the "Authentication/Authorization" section.

---

> [!TIP]
> **Pro Practice**: Next time you build a feature, ask yourself: *"If I change the ID in the URL, can I see someone else's data?"* If the answer is yes, you need to verify the user's identity via their token!
