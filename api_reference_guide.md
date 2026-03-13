# 📔 AMU Monitoring System: API Endpoint Reference

This guide serves as your blueprint for understanding how the frontend and backend talk to each other. Every entry follows the **"On Paper" Design Pattern** we discussed.

---

## 🔐 1. Authentication & Profile
These endpoints handle who can enter the system and their identity.

### **POST /api/register/**
- **Goal**: Create a new account.
- **Payload**:
  ```json
  {
    "first_name": "string",
    "last_name": "string",
    "email_address": "string",
    "password": "string",
    "role": "data_operator | vet | regulator"
  }
  ```
- **Response (201)**: `{ "message": "User registered successfully.", "user_id": 1 }`

### **POST /api/login/**
- **Goal**: Authenticate and receive a JWT.
- **Payload**: `{ "email_address": "string", "password": "string" }`
- **Response (200)**: Contains the `token`, `user_name`, `role`, and `profile` status.

### **POST /api/update-profile/**
- **Goal**: Complete user profile (State, District, etc.).
- **Auth**: Required (JWT).
- **Payload**: `{ "state": "string", "district": "string", "address": "string", "phone_number": "string" }`

---

## 🚜 2. Farm & Owner Management
Handling the physical locations and the people who own them.

### **GET /api/farms/**
- **Goal**: List all farms the user has access to.
- **Auth**: Required. Vets see all; Operators see theirs.
- **Response (200)**: `[ { "id": 1, "name": "Farm Alpha", ... }, ... ]`

### **POST /api/farms/**
- **Goal**: Create a new farm.
- **Payload**: Includes farm metadata and optionally an `owner_id` or `owner_name` to create a new owner simultaneously.

---

## 🐑 3. Flock & Animal Tracking
The "Inventory" of the system.

### **POST /api/flocks/bulk/**
- **Goal**: Register a large number of animals at once.
- **Payload**:
  ```json
  {
    "farm_id": 1,
    "owner_id": 1,
    "flock_code": "FLK01",
    "species_type": "AVI",
    "count": 500
  }
  ```
- **Backend Logic**: Automatically generates tags (e.g., `FARM1-FLK01-001`) for every individual animal.

---

## 💊 4. Treatments & Prescriptions
The core logic for AMU (Antimicrobial Use) tracking.

### **POST /api/treatments/**
- **Goal**: Operator logs an observation or a requested treatment.
- **Status**: Set to `pending`.
- **Logic**: Automatically assigns a Vet based on the Farm's district.

### **POST /api/treatments/{id}/action/**
- **Goal**: Vet approves or rejects a pending treatment.
- **Payload**: `{ "action": "approve | reject", "vet_notes": "..." }`
- **Logic**: Updates the status. If approved, the withdrawal period calculation starts.

### **POST /api/treatments/prescribe/**
- **Goal**: Vet directly creates an approved treatment (skipping the pending phase).

---

## 🧪 5. Reference Data
Static data used for calculations and dropdowns.

### **GET /api/reference/drugs/**
- **Goal**: Fetch the complete list of authorized molecules and their MRL (Maximum Residue Limits).
- **Response**: List of molecules grouped by family with species-specific tissue limits.

---

> [!TIP]
> **Study Pattern**: Look at `backend/farms/views.py`. Notice how every `post` method starts with `json.loads(request.body)`. This is the "Truck" dumping its cargo for the server to sort.
