# Migration Guide: Username/Password Authentication

This guide explains the changes made to switch from Firebase Authentication to custom username/password authentication.

## What Changed

### 1. Authentication System
- **Before**: Firebase Authentication with email/password
- **After**: Custom authentication using Firestore `users` collection with username/password

### 2. Data Models
- **New `User` interface** in `types/models.ts`:
  - `id`: Firestore document ID
  - `username`: Unique username for login
  - `role`: 'tenant' or 'admin'
  - Passwords are hashed using SHA-256 and stored in Firestore (not exposed in the User interface)

- **Updated `Flat` interface**:
  - Changed `userUid` → `userId` (now references Firestore user document instead of Firebase Auth UID)

### 3. New Services
- **`services/security.ts`**: Password hashing utilities
- **`services/users.ts`**: User CRUD operations

### 4. Updated Components
- `LoginPage`: Username field instead of email
- `Layout`: Shows username instead of email
- `ProtectedRoute`: Uses custom auth state
- `TenantDashboard`: Uses `getFlatByUserId` instead of `getFlatByUserUid`
- `AdminDashboard`: Added "View receipt" button for approved readings
- `AdminFlatsPage`: Creates both user and flat when adding a new tenant
- **New `AdminUsersPage`**: Manage usernames and reset passwords

## Setup Instructions

### Step 1: Create Initial Admin User

Since there's no Firebase Authentication anymore, you need to manually create an admin user in Firestore:

1. Open Firebase Console → Firestore Database
2. Create a new collection called `users` (if it doesn't exist)
3. Add a document with the following fields:

```
username: "admin"
passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
role: "admin"
flatId: null
createdAt: <current timestamp in milliseconds>
```

**Note**: The password hash above is for the password `"admin"`. You can use this to log in initially.

### Step 2: Test Login Flow

1. Start the development server: `npm run dev`
2. Navigate to the login page
3. Enter:
   - Username: `admin`
   - Password: `admin`
4. You should be redirected to the admin dashboard

### Step 3: Create Tenants

From the admin dashboard:

1. Click "Add tenant / flat"
2. Fill in:
   - **Flat ID**: e.g., "A-101"
   - **Initial reading**: Optional meter reading
   - **Tariff per unit**: e.g., 7.5
   - **Tenant name**: Optional display name
   - **Username**: Login username for the tenant (e.g., "flat_a101")
   - **Password**: Initial password for the tenant
3. Click "Create tenant & flat"

This will create both:
- A `users` document with hashed password
- A `flats` document linked to that user

### Step 4: Manage Users

From the admin dashboard:

1. Click "Manage users"
2. You can:
   - Change any user's username
   - Reset any user's password
   - Edit your own admin credentials

### Step 5: View Receipts (Admin)

In the admin dashboard history table:

1. Go to the "History" section
2. Switch to "Approved" tab
3. For any approved reading, click "View receipt"
4. The receipt modal will show with the tenant's name and all billing details
5. Admin can download the PDF just like tenants can

## Security Notes

- Passwords are hashed using SHA-256 before storing in Firestore
- No plain-text passwords are stored
- Password hashes are never sent to the client UI (only stored in Firestore)
- User authentication state is stored in `localStorage`
- For production use, consider:
  - Using a stronger hashing algorithm (bcrypt, argon2)
  - Adding server-side validation via Cloud Functions
  - Implementing rate limiting on login attempts
  - Adding password strength requirements
  - Using HTTPS for all connections

## Testing Checklist

- [ ] Admin can log in with username/password
- [ ] Admin can create new tenants with username/password
- [ ] Admin can view and manage all users
- [ ] Admin can change usernames and reset passwords
- [ ] Admin can view receipts from the history table
- [ ] Tenant can log in with username/password
- [ ] Tenant can upload meter readings
- [ ] Tenant can view their approved readings and download receipts
- [ ] Tenant dashboard shows correct flat information
- [ ] Logout works correctly for both roles
- [ ] Protected routes redirect to login when not authenticated
- [ ] Role-based access control works (tenant can't access /admin, etc.)

## Firestore Collections Structure

### `users` Collection
```
users/
  {userId}/
    username: string (unique)
    passwordHash: string
    role: 'tenant' | 'admin'
    flatId: string | null
    createdAt: number
```

### `flats` Collection
```
flats/
  {flatId}/
    flatId: string
    tenantName: string (optional)
    tariffPerUnit: number
    userId: string (references users document)
    initialReading: number | null
```

### `readings` Collection
```
readings/
  {readingId}/
    flatId: string
    ocrReading: number | null
    correctedReading: number | null
    previousReading: number | null
    unitsUsed: number | null
    amount: number | null
    imageUrl: string
    status: 'pending' | 'approved' | 'rejected'
    createdAt: number
    approvedAt: number (optional)
    tariffAtApproval: number | null
    yearMonth: string
    ocrConfidence: number (optional)
    rejectionReason: string (optional)
    reopenReason: string (optional)
```

## Troubleshooting

### Can't log in
- Verify the user document exists in Firestore
- Check that the `passwordHash` field is correct
- Ensure the username matches exactly (case-sensitive)
- Check browser console for errors

### Tenant dashboard shows "No flat linked"
- Verify the `flats` document has the correct `userId` field
- Ensure the `userId` matches the user's document ID in Firestore

### Receipt not showing tenant name
- Verify the `flats` document has a `tenantName` field
- Check that admin dashboard loaded all flats correctly

## Password Hashing Reference

To generate a password hash manually (if needed), use this JavaScript:

```javascript
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Example: hash the password "admin"
hashPassword('admin').then(console.log)
// Output: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
```

You can run this in the browser console to generate hashes for manual user creation.
