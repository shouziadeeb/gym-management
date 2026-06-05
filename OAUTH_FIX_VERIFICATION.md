# OAuth PKCE Flow - Verification & Testing Guide

## ✅ Changes Applied

All fixes are now in place. Here's what was changed:

| File | Change | Purpose |
|------|--------|---------|
| `src/services/auth/providers/google.provider.ts` | Removed `clearLegacyWebAuthStorage()` call before OAuth | Preserve PKCE verifier during OAuth flow |
| `src/lib/auth-oauth-callback.ts` | Removed cleanup after callback | Don't interfere with session establishment |
| `src/lib/auth-oauth-cleanup.ts` | Skip cleanup on `/auth/callback` path | Protect PKCE keys during exchange |

## 🔍 Step 1: Verify Setup in Supabase

### Access Supabase Dashboard

**URL:** https://supabase.com/dashboard

1. **Select your project** from the list
2. Go to **Authentication** (left sidebar)
3. Click **Providers**

### Step 1a: Google OAuth Configuration

1. Click **Google** from the provider list
2. Verify status shows **Enabled** ✅
3. Check these are filled in:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
4. If not configured:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials (Desktop application)
   - Copy Client ID and Secret to Supabase

### Step 1b: Verify Redirect URIs

1. In Supabase, go to **Authentication** → **URL Configuration**
2. You should see a list of Redirect URLs
3. **Add these URLs** (if not already present):

   **For Development (Expo local):**
   ```
   exp://localhost:19000/auth/callback
   exp://127.0.0.1:19000/auth/callback
   ```

   **For Native Mobile:**
   ```
   gymapp://auth/callback
   ```

   **For Web Testing:**
   ```
   http://localhost:3000/auth/callback
   http://localhost:5173/auth/callback
   ```

   **For Production (update as needed):**
   ```
   https://yourdomain.com/auth/callback
   ```

4. **Important:** Ensure these are **exactly** the same in:
   - Supabase → URL Configuration ✅
   - Google Cloud Console → OAuth credentials ✅
   - Your app's `src/lib/auth-redirect-uri.ts` (should be automatic)

## 🧪 Step 2: Test the Fix Locally

### Terminal Setup

1. **Clear node_modules and cache:**
   ```bash
   rm -r node_modules
   npm install
   npm run web  # or: npx expo start --clear
   ```

2. **Start fresh dev server:**
   ```bash
   npx expo start -c  # -c = clear cache
   ```

### Browser Testing

1. **Clear localStorage completely:**
   - Open DevTools (`F12`)
   - Go to **Application** tab
   - Click **Storage** → **Local Storage** → **http://localhost:19000**
   - Delete ALL entries
   - Close DevTools

2. **Reload the app:**
   - Press `Ctrl+Shift+R` (hard refresh)
   - Wait for app to load

3. **Monitor localStorage during OAuth:**
   - Open DevTools again
   - Go to **Application** → **Local Storage**
   - Leave this open
   - Click "Sign in with Google"
   - **OBSERVE:** Should see keys with `sb-`, `pkce`, etc. appear
   - **EXPECTED:** Browser redirects to Google (localStorage persists)
   - Sign in with your Google account
   - **EXPECTED:** Redirected back to `localhost:19000/auth/callback`
   - **VERIFY:** `sb-*` keys are still there during redirect

4. **Check for errors in Console:**
   - Open DevTools → **Console** tab
   - Look for these errors (they should NOT appear):
     ```
     ❌ PKCE code verifier not found in storage
     ❌ invalid flow state, no valid flow state found
     ❌ 404 (Not Found) on token endpoint
     ```
   - Instead, look for success logs:
     ```
     ✅ [INFO] auth.oauth.callback_storage_state
     ✅ [INFO] auth.oauth.complete
     ```

## 📊 Step 3: Monitor Supabase Logs

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Logs** (bottom of left sidebar)

2. **Trigger a Google sign-in and watch the logs:**
   - You should see entries like:
     ```
     provider_id: google
     event: signed_in
     status: success
     ```

3. **If still failing, look for:**
   - `exchangeCodeForSession` errors
   - `PKCE` related errors
   - Redirect URL mismatch errors

## 🐛 Troubleshooting

### Issue: "PKCE code verifier not found in storage"

**Possible Causes:**
1. Cache not cleared - `npm run web` with `-c` flag
2. Redirect URI mismatch between Supabase and Google Console
3. Using different Supabase project than configured in `.env`

**Fix:**
```bash
# Clear everything
rm -r node_modules .expo
npm install
npx expo start -c

# In browser: Ctrl+Shift+R (hard refresh)
# In DevTools: Delete all localStorage entries
# Try signing in again
```

### Issue: "invalid flow state, no valid flow state found"

**Likely Cause:** Supabase state parameter not matching

**Check:**
1. Supabase URL and ANON_KEY in `.env` are correct
2. No old Supabase projects are still referenced
3. Redirect URI in Supabase matches exactly what Google shows

### Issue: 404 on token endpoint

**Likely Cause:** Wrong Supabase project URL

**Verify:**
1. Check `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   ```
2. This URL should match in Supabase Dashboard → Project Settings → API
3. Restart dev server after changing `.env`

### Issue: Redirect to Google works, but no redirect back

**Check:**
1. Are you using an incognito/private window? OAuth might be blocked
2. Check browser console for CORS errors
3. Verify Google credentials are valid in Google Cloud Console
4. Check Supabase logs for error details

## ✨ Success Indicators

When everything is working correctly, you should see:

1. **Browser Console:**
   ```
   [INFO] auth.oauth.callback_storage_state
     url: "http://localhost:19000/auth/callback?code=..."
     storageKeysWithCodeOrPkce: ["sb-xyz", "sb-pkce-abc"]
     hasCode: true
   
   [INFO] auth.oauth.complete
     destination: "/profile-setup"
     userId: "user-id-123"
   ```

2. **Storage Keys Present:**
   - `sb-*` keys (Supabase session)
   - `gym-auth` (your app's auth session)
   - `gym_oauth_pending` (OAuth state)

3. **User Flow:**
   - Click "Sign in with Google" ✅
   - Redirected to Google → Sign in ✅
   - Redirected back to profile setup ✅
   - Session stored ✅
   - Can navigate app ✅

## 🔧 Additional Debugging

### Enable Verbose Logging

Edit `src/lib/logger.ts` or your logger config:
```typescript
// Set log level to trace/debug to see more details
const logLevel = __DEV__ ? 'debug' : 'info';
```

### Check Supabase Configuration

Run this in browser console:
```javascript
// Should show your Supabase URL
console.log(supabase.auth.getSession());

// Check localStorage for keys
console.log(
  Object.keys(localStorage).filter(k => 
    k.includes('sb-') || k.includes('pkce') || k.includes('oauth')
  )
);
```

### Network Tab Analysis

In DevTools → **Network** tab during OAuth:
1. Look for POST to `.../auth/v1/token`
2. Should return 200 (not 404)
3. Response should contain `access_token` and `refresh_token`

## 📞 If Still Failing

Please check:
1. ✅ `.env` has correct Supabase URL and ANON_KEY
2. ✅ Supabase URL Configuration has all required redirect URIs
3. ✅ Google Cloud Console OAuth credentials match Supabase URL Configuration
4. ✅ Dev server was restarted after code changes
5. ✅ Browser cache/localStorage cleared completely
6. ✅ No proxy or CORS issues (check Network tab)
7. ✅ Supabase project is not suspended/deleted

## Next Steps

Once OAuth is working:
1. Test email OTP sign-in
2. Test phone OTP sign-in
3. Verify user profile is created in Supabase
4. Test session persistence (reload page)
5. Test signing out
