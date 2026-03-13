# 📝 The SDE Exercise: Blueprinting on Paper

To master API architecture, try this exercise for your next feature **before** you touch your keyboard. If you can't fill this out, you aren't ready to code.

---

## The Feature: [Feature Name]
*Example: User adds a new animal to a flock*

### 1. The Endpoint Design
- **Method**: (GET/POST/PUT/PATCH/DELETE)
- **Path**: `/api/...`
- **Query Params**: (e.g., `?flock_id=123`)

### 2. The Data Contract (JSON)
**Incoming Payload:**
```json
{
  "key": "value"
}
```
**Success Response (200/201):**
```json
{
  "status": "success"
}
```

### 3. The Security Guard (Middleware & AuthZ)
- What is the minimum role required?
- Can a user "spoof" this by changing an ID in the URL?
- Does the middleware need to attach any extra info?

### 4. The Edge-Case Matrix
- **400 Bad Request**: When is the input "garbage"?
- **401 Unauthorized**: When is the token missing/expired?
- **403 Forbidden**: When is the user "who they say they are" but NOT allowed to do this?
- **404 Not Found**: What ID could be missing?
- **409 Conflict**: Can this be done twice? (e.g., creating the same animal tag).

### 5. Database Impact
- Which tables are we writing to?
- Are we updating an existing row or creating a new one?
- Do we need a **Database Transaction**? (i.e., if Step A works but Step B fails, do we need to undo Step A?)

---

> [!TIP]
> **Mentorship Advice**: When you ask me for help with a bug, I will often ask you: *"Show me the blueprint."* If you don't have one, the bug is usually in your logic, not your syntax.
