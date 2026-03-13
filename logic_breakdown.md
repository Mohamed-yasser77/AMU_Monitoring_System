# The Architecture of Security: Logic Breakdown

As your mentor, I've distilled the "Secret Sauce" of the changes we made. This is the logic you should carry with you to every project, regardless of the language.

## 1. The Gatekeeper: JWT Middleware Logic
**Goal**: Passive, global authentication that views don't have to think about.

```text
ON RECEIVE REQUEST:
  1.  Check: Is the URL whitelisted? (e.g., /login, /static)
      IF YES -> Pass to View.
      
  2.  Extract: Look at 'Authorization' Header.
      IF Not Present OR Not 'Bearer <token>' -> Return 401 (Stop).
      
  3.  Verify: Decrypt Token Signature using SERVER_SECRET.
      IF Corrupted OR Modified -> Return 401 (Stop).
      IF Expired -> Return 401 (Stop).
      
  4.  Identify: Extract 'user_id' from the decrypted payload.
      Look up User in Database.
      IF Not Found -> Return 401 (Stop).
      
  5.  Attach: Set request.user = User Object.
      Pass to View.
```

## 2. The Command Center: Frontend Service Logic
**Goal**: Zero-effort authentication from the UI components.

```text
ON API CALL (data, endpoint):
  1.  Prepare: Set Method (GET/POST) and Content-Type.
  
  2.  Inject Identity: Read 'token' from LocalStorage.
      IF Token exists -> Append 'Authorization: Bearer <token>' to Headers.
      
  3.  Execute: Send the Request.
  
  4.  Intercept Response:
      IF Status is 200/201 -> Return JSON Data.
      IF Status is 401 (Unauthorized) ->
         - Clear LocalStorage (Logout).
         - Redirect browser to '/login'.
         - Alert: "Session Expired".
      ELSE -> Throw Error with Message.
```

## 3. The Foundation: User Model Logic
**Goal**: Compliance with industry-standard authentication frameworks.

```text
DEFINE USER MODEL:
  - Extend BaseAuthClass (provides hashing, status, etc.)
  - Set USERNAME_FIELD = 'email' (Unique identifier)
  - REQUIRED_FIELDS = ['first_name', 'last_name']
  
  ON SAVE (Password):
    - Take Plaintext Password.
    - APPLY One-Way Salted Hash (e.g., Argon2, bcrypt).
    - NEVER store original string.
    
  ON LOGIN:
    - Receive Plaintext Password.
    - Hash Input AND Compare with Stored Hash.
    - IF Match AND User is_active -> Issue JWT.
```

## 4. The Shield: CSRF & CORS Logic
**Goal**: Restrict WHO can talk to your server and WHERE they can do it from.

```text
CORS (Cross-Origin Resource Sharing):
  - Allow-List: ['http://127.0.0.1:5051', 'http://localhost:3000']
  - Action: Allow Browser to make requests ONLY if the Origin matches the list.

CSRF (Cross-Site Request Forgery):
  - Rule: Require a cryptographically unique "proof of intent" for State-Changing requests (POST/PUT).
  - Exception: Whitelist stateless API entry points (Login/Register) where Identity is proven by Credentials, not Cookies.
```

**Understanding these four patterns is 90% of full-stack engineering. The code is just the syntax used to express them.**
