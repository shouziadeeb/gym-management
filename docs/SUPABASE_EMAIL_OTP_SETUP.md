# Supabase Email OTP Setup (Instagram-style)

The app sends a **real 6-digit code** to whatever email the user enters. There is **no** hardcoded `123456` for email in the app.

## 1. Supabase Dashboard

1. **Authentication → Providers → Email** → Enable Email provider.
2. **Authentication → Email Templates** → open **Magic Link** (or **OTP** template if available).
3. Ensure the email body includes the token, for example:

   ```html
   <p>Your verification code is: <strong>{{ .Token }}</strong></p>
   ```

   Not only a clickable link — users enter the code in the app.

4. **Authentication → Rate Limits** — avoid blocking test sends.

5. **Project Settings → Auth → SMTP** (recommended for production):
   - Configure custom SMTP (Resend, SendGrid, etc.) so emails are delivered reliably.
   - Without SMTP, Supabase’s default mailer has strict rate limits.

## 2. App environment

Phone and email auth are controlled **independently**:

```env
# Phone: fake OTP 123456 in local Expo dev (optional in production)
EXPO_PUBLIC_ENABLE_DEV_PHONE_AUTH=true

# Email: always real Supabase OTP — no dev bypass env flag
```

Restart Expo after changing `.env`:

```bash
npx expo start --clear
```

`EXPO_PUBLIC_ENABLE_DEV_PHONE_AUTH` (or legacy `EXPO_PUBLIC_ENABLE_DEV_AUTH`) affects **phone only**, never email.

## 3. Test flow

1. Open app → **Continue with Email**
2. Enter your real email → **Send login code**
3. Check inbox/spam for a **6-digit code** from Supabase
4. Enter the **6-digit** code in the app (the UI accepts exactly 6 digits for email)

If your email shows an **8-digit** code, update the Supabase email template or Auth OTP settings so `{{ .Token }}` is 6 digits, or the app and email length will not match.

## 4. Troubleshooting

| Symptom | Fix |
|--------|-----|
| No email received | Configure SMTP; check Auth logs in Supabase |
| Only magic link, no code | Edit template to show `{{ .Token }}` |
| `123456` still works for email | Rebuild app; confirm dev auth is `false`; email code no longer accepts dev bypass |
| Rate limit error | Wait 60s or lower rate limits in dashboard |

## 5. Auth logs

**Authentication → Logs** in Supabase shows each `signInWithOtp` and delivery status.
