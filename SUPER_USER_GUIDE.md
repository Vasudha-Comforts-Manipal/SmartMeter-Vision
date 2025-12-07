# Super User Guide

## Overview

The Super User feature provides an emergency access mechanism to reset admin passwords when the admin account is locked out or forgotten. This is a last-resort solution that uses Gmail authentication via Google OAuth.

## Features

- 🔐 **Gmail Authentication**: Uses Google OAuth for secure authentication
- 🚨 **Emergency Access Only**: Restricted to password reset functionality
- 👤 **Single Super User**: Only one authorized Gmail address can access
- 🔒 **Secure**: Email verification ensures only authorized users can access

## Setup Instructions

### Step 1: Enable Google Sign-In in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Enable Google Sign-In
6. Add your authorized domains (e.g., `localhost` for development, your production domain)
7. Save the changes

### Step 2: Configure Environment Variable

Add the super user email to your `.env` file:

```env
VITE_SUPER_USER_EMAIL=your-super-user@gmail.com
```

**Important**: Replace `your-super-user@gmail.com` with the actual Gmail address that should have super user access.

### Step 3: Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## Usage

### Accessing Super User Dashboard

1. Navigate to `/superuser/login` or click "Super User Access" link on the login page
2. Click "Sign in with Google"
3. Select the authorized Gmail account
4. If the email matches `VITE_SUPER_USER_EMAIL`, you'll be redirected to the super user dashboard
5. If the email doesn't match, you'll see an access denied error

### Resetting Admin Password

1. Once logged in as super user, you'll see a list of all admin users
2. Click on an admin username to select it
3. Enter the new password (minimum 6 characters)
4. Confirm the password
5. Click "Reset Password"
6. The admin password will be updated immediately

### Logging Out

Click the "Logout" button in the top-right corner of the super user dashboard to sign out.

## Security Considerations

1. **Email Verification**: Only the email specified in `VITE_SUPER_USER_EMAIL` can access the super user dashboard
2. **Limited Access**: Super users can ONLY reset admin passwords - they cannot access regular admin features
3. **No Backend Access**: This solution works entirely client-side, so you don't need backend access
4. **Password Requirements**: Minimum 6 characters for admin passwords

## Troubleshooting

### "Super user email not configured" Error

- Make sure `VITE_SUPER_USER_EMAIL` is set in your `.env` file
- Restart your development server after adding the variable

### "Access denied" Error

- Verify that the Gmail account you're using matches exactly with `VITE_SUPER_USER_EMAIL`
- Check for typos or case sensitivity issues
- The email comparison is case-insensitive, but must match exactly

### Google Sign-In Not Working

- Ensure Google Sign-In is enabled in Firebase Console
- Check that your domain is authorized in Firebase Authentication settings
- For localhost, make sure `localhost` is added to authorized domains

### "auth/configuration-not-found" Error

This error means Firebase Authentication is not properly configured. Follow these steps:

1. **Enable Authentication in Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click on **Authentication** in the left sidebar
   - If you see "Get started", click it to enable Authentication
   - If Authentication is already enabled, proceed to step 2

2. **Enable Google Sign-In Provider:**
   - In Authentication, click on **Sign-in method** tab
   - Find **Google** in the list of providers
   - Click on it
   - Toggle **Enable** to ON
   - Enter a project support email (can be any email)
   - Click **Save**

3. **Add Authorized Domains:**
   - Still in Authentication, click on **Settings** tab
   - Scroll to **Authorized domains**
   - For development, make sure `localhost` is in the list
   - For production, add your production domain
   - Domains are added automatically when you enable a provider, but verify they're there

4. **Verify Environment Variables:**
   - Make sure `VITE_FIREBASE_AUTH_DOMAIN` in your `.env` matches your Firebase project's auth domain
   - The auth domain format is usually: `your-project-id.firebaseapp.com`
   - You can find it in Firebase Console → Project Settings → General → Your apps

5. **Restart Development Server:**
   - After making changes, restart your dev server: `npm run dev`

### No Admin Users Found

- Make sure there are admin users in your Firestore `users` collection
- Check that admin users have `role: "admin"` in their user document

## Routes

- `/superuser/login` - Super user login page
- `/superuser` - Super user dashboard (protected route)

## Files Created

- `src/services/superUserAuth.ts` - Super user authentication service
- `src/pages/SuperUserLoginPage.tsx` - Super user login page
- `src/pages/SuperUserDashboard.tsx` - Super user dashboard
- `src/components/SuperUserProtectedRoute.tsx` - Route protection for super user

## Best Practices

1. **Keep Super User Email Secure**: Don't commit the `.env` file with the super user email to version control
2. **Use Strong Gmail Account**: Use a Gmail account with 2FA enabled for the super user
3. **Document Access**: Keep a record of who has access to the super user account
4. **Regular Audits**: Periodically review who has super user access
5. **Emergency Only**: Remind users that this is for emergencies only, not regular password resets
