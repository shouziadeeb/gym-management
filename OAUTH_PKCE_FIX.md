# OAuth PKCE Authentication Issues - Fixed ✅

## Summary of Issues

Your Google OAuth authentication was failing with these errors:
- ❌ "PKCE code verifier not found in storage"
- ❌ "invalid flow state, no valid flow state found"  
- ❌ 404 error on token exchange endpoint

## Root Cause

The app was calling `clearLegacyWebAuthStorage()` **before** starting the OAuth flow, which removed PKCE (Proof Key for Code Exchange) state/verifier keys that Supabase needed to:
1. Generate the OAuth authorization request
2. Exchange the authorization code for a session after Google redirects back

## Fixes Applied ✅

### 1. **Protected PKCE Keys** (`src/lib/auth-oauth-cleanup.ts`)
Modified the cleanup function to preserve PKCE-related keys:
```typescript
// Now skips: 'pkce', 'code_verifier', 'state' keys
if (key.includes('pkce') || key.includes('code_verifier') || key.includes('state')) {
  continue;  // Don't delete these PKCE keys
}
```

### 2. **Removed Premature Cleanup** (`src/services/auth/providers/google.provider.ts`)  
Stopped calling `clearLegacyWebAuthStorage()` before OAuth starts:
```typescript
// ❌ BEFORE:
clearLegacyWebAuthStorage();  // Removed - breaks PKCE
clearOAuthPendingStorage();

// ✅ AFTER:
clearOAuthPendingStorage();  // Only clear old pending state
await saveOAuthPending({ mode, redirect });
```

### 3. **Deferred Cleanup** (`src/lib/auth-oauth-callback.ts`)
Moved cleanup to **after** successful OAuth exchange:
```typescript
// Cleanup happens AFTER PKCE exchange succeeds
clearLegacyWebAuthStorage();
```

## What to Verify in Supabase ✅

**In Supabase Dashboard**, confirm these settings:

### Authentication → Google Provider
1. ✅ **Google OAuth enabled**
2. ✅ **Google OAuth credentials configured**:
   - Client ID and Secret from Google Cloud Console
   - Redirect URIs in Google Console match Supabase

### Authentication → URL Configuration  
Add these redirect URIs (ensure they're **exactly** as listed):

**For Development (Expo):**
```
exp://localhost:19000/auth/callback
exp://127.0.0.1:19000/auth/callback
```

**For Native Apps:**
```
gymapp://auth/callback
```

**For Web Testing (if testing on web):**
```
http://localhost:3000/auth/callback
http://localhost:3000
http://localhost:5173/auth/callback
```

**For Production:**
```
https://yourdomain.com/auth/callback
```

### Google Cloud Console
Ensure your OAuth 2.0 credential's redirect URIs include all Supabase callback URLs.

## Testing Steps

1. **Clear Browser Storage**
   - Open DevTools → Application → Storage → LocalStorage
   - Delete all entries starting with `sb-`, `gym-`, etc.
   - Close and reopen the app

2. **Test Google Sign-In**
   - Click "Sign in with Google"
   - You should redirect to Google login
   - Sign in with your Google account
   - You should redirect back to the app's profile setup

3. **Monitor Supabase Logs**
   - In Supabase Dashboard → Authentication → Logs
   - Look for successful `exchangeCodeForSession` entries
   - No more "PKCE code verifier not found" errors

## Common Issues if Still Broken

| Problem | Solution |
|---------|----------|
| Still getting PKCE errors | 1. Hard refresh (`Ctrl+Shift+R`) the browser<br>2. Clear `localStorage` in DevTools<br>3. Restart Expo/dev server<br>4. Check Supabase redirect URIs match exactly |
| "Redirect URL does not match" | Check Supabase URL Configuration - ensure your exact callback URL is listed |
| 404 on token endpoint | Usually means redirect URI mismatch or Supabase misconfiguration |
| Silent failure (no redirect) | Check browser console for JavaScript errors<br>Verify Google OAuth credentials are valid |

## Files Changed

```
src/lib/auth-oauth-cleanup.ts           # Protected PKCE keys
src/services/auth/providers/google.provider.ts  # Removed premature cleanup
src/lib/auth-oauth-callback.ts          # Added deferred cleanup
```

## Technical Details

### PKCE Flow (What's Happening)

1. **User clicks "Sign in with Google"**
   - `signInWithGoogle()` called
   - ✅ Now: PKCE state is preserved

2. **Supabase auth.signInWithOAuth()**
   - Generates code verifier & code challenge
   - Saves to localStorage
   - Constructs Google OAuth URL

3. **Browser redirects to Google**
   - User signs in

4. **Google redirects back with authorization code**
   - Browser goes to `exp://localhost:19000/auth/callback?code=...&state=...`

5. **Supabase exchanges code for session**
   - Retrieves code verifier from storage ← **THIS WAS FAILING**
   - Sends to Supabase token endpoint
   - Gets session token
   - ✅ Now: PKCE state still available → exchange succeeds

## Related Files (Reference)

- `src/lib/supabase.ts` - Supabase client config with `flowType: 'pkce'`
- `src/hooks/useAuthSession.ts` - Bootstrap OAuth completion
- `src/lib/auth-oauth-callback.ts` - Handle OAuth callback
- `app/auth/callback.tsx` - Callback route
- `.env` - Supabase URL and ANON_KEY

## Next Steps

1. ✅ Deploy these fixes to your development environment
2. ✅ Test Google sign-in flow end-to-end
3. ✅ Monitor Supabase authentication logs
4. ✅ For production, ensure all redirect URIs are configured
