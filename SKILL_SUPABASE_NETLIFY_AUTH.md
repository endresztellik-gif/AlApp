# Skill: Supabase + Netlify User Invitation & Authentication

**Skill Type:** Globális, újrafelhasználható
**Használat:** Bármely Supabase + Netlify + React/Next.js projektben
**Verzió:** 1.0.0
**Utolsó frissítés:** 2026-02-23

---

## 📖 Skill Leírás

Ez a skill egy **teljes körű, production-ready** user invitation és authentication flow implementációját írja le Supabase backend + Netlify frontend környezetben.

**Mit csinál:**
- ✅ Admin userek meghívhatnak új usereket email címmel
- ✅ Invited userek emailben kapnak meghívót
- ✅ Kötelező jelszó beállítás első bejelentkezéskor
- ✅ Biztonságos authentication flow
- ✅ Custom SMTP (Gmail) használata
- ✅ Persistent session management

**Technológiák:**
- Supabase Auth + Edge Functions
- Gmail SMTP (vagy más SMTP provider)
- Netlify deployment
- React + React Router (vagy Next.js App Router)
- TypeScript

---

## 🎯 Mikor használd ezt a skill-t?

✅ **Használd ha:**
- Supabase-t használsz authentication-höz
- Netlify-on deployolsz
- Admin-user meghívási funkció kell
- Kötelező jelszó beállítást akarsz
- Gmail SMTP-t szeretnél használni (2 email/óra limit helyett 500/nap)

❌ **NE használd ha:**
- Nem Supabase-t használsz
- Nem kell admin meghívási funkció
- Magic link authentication elég (jelszó nélkül)

---

## 🏗️ Architektúra Áttekintés

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN USER                              │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 1. Invite user (email, name, role)
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Netlify)                           │
│  - useUsersAdmin hook                                           │
│  - InviteUserDialog component                                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 2. POST /functions/v1/invite-user
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTION                             │
│  - Admin auth check                                             │
│  - inviteUserByEmail({ data: { password_set: false } })         │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 3. Email via SMTP
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GMAIL SMTP                                   │
│  - smtp.gmail.com:465/587                                       │
│  - App Password authentication                                  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 4. Email arrives
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                      INVITED USER                               │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 5. Click invitation link
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE AUTH + FRONTEND                           │
│  - Auto login (session creation)                                │
│  - ProtectedRoute checks: password_set === false                │
│  - Redirect to /auth/setup-password                             │
│  - SetupPasswordPage: supabase.auth.updateUser()                │
│    → password + data: { password_set: true }                    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 6. Password set → Dashboard access
                   ↓
                   ✅ DONE
```

---

## 📋 Implementációs Lépések

### STEP 1: SMTP Beállítás (Gmail vagy más provider)

#### 1.1 Gmail App Password

```bash
# Gmail account → Security → 2-Step Verification → App passwords
# Generálj egy új App Password-öt
APP_PASSWORD="your-app-password-here"  # 16 karakter, szóközök nélkül
```

#### 1.2 Supabase Dashboard SMTP

```
URL: https://supabase.com/dashboard/project/<PROJECT_ID>/auth/email-templates
Navigáció: Authentication → Email → SMTP Settings

Enable Custom SMTP: ✅
SMTP Host: smtp.gmail.com  ⚠️ WHITESPACE NÉLKÜL!
SMTP Port: 465 (SSL) vagy 587 (STARTTLS)
SMTP User: your-email@gmail.com
SMTP Password: <APP_PASSWORD>
Sender Email: your-email@gmail.com
Sender Name: Your App Name
```

**⚠️ KRITIKUS:** Az SMTP Host mezőben **SEMMILYEN WHITESPACE** ne legyen!

---

### STEP 2: Supabase URL Configuration

```
URL: https://supabase.com/dashboard/project/<PROJECT_ID>/auth/url-configuration

Site URL: https://your-app.netlify.app
Redirect URLs: https://your-app.netlify.app/**
```

**A `/**` wildcard KÖTELEZŐ!**

---

### STEP 3: Edge Function

#### 3.1 Fájl létrehozás

```bash
# Projekt root-ban
mkdir -p supabase/functions/invite-user
touch supabase/functions/invite-user/index.ts
```

#### 3.2 Edge Function kód

```typescript
// supabase/functions/invite-user/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get logged-in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // 2. Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can invite users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // 3. Get request body
    const { email, fullName, role } = await req.json()

    if (!email || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 4. Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 5. Invite user with password_set flag
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        role,
        password_set: false  // ⬅️ KRITIKUS! Persistent flag
      },
      redirectTo: `${Deno.env.get('SITE_URL')}/auth/setup-password`
    })

    if (error) {
      console.error('Invite error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, user: data.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

#### 3.3 Environment Variables

```bash
# Set SITE_URL
SUPABASE_ACCESS_TOKEN=<YOUR_ACCESS_TOKEN> \
  npx supabase secrets set SITE_URL=https://your-app.netlify.app
```

#### 3.4 Deploy

```bash
SUPABASE_ACCESS_TOKEN=<YOUR_ACCESS_TOKEN> \
  npx supabase functions deploy invite-user --no-verify-jwt
```

---

### STEP 4: Frontend - ProtectedRoute

#### 4.1 ProtectedRoute Component

```typescript
// src/core/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // ⬅️ KRITIKUS: Ellenőrizzük a password_set flag-et
    const needsPasswordSetup = user?.user_metadata?.password_set === false;

    if (needsPasswordSetup && location.pathname !== '/auth/setup-password') {
        return <Navigate to="/auth/setup-password" replace />;
    }

    return <>{children}</>;
}
```

---

### STEP 5: Frontend - SetupPasswordPage

#### 5.1 SetupPasswordPage Component

```typescript
// src/core/auth/SetupPasswordPage.tsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { validatePassword } from '@/shared/utils/passwordValidation';

export const SetupPasswordPage = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validation = validatePassword(password);
    const passwordsMatch = password === confirmPassword;
    const canSubmit = validation.isValid && passwordsMatch;

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!canSubmit) return;

            setIsLoading(true);
            setError(null);
            try {
                // ⬅️ KRITIKUS: Password + metadata frissítés
                await supabase.auth.updateUser({
                    password,
                    data: { password_set: true }  // Flag frissítése
                });

                window.location.hash = '';
                navigate('/', { replace: true });
            } catch (err: unknown) {
                console.error('Password setup error:', err);
                setError(err instanceof Error ? err.message : 'Error setting password');
            } finally {
                setIsLoading(false);
            }
        },
        [password, canSubmit, navigate]
    );

    return (
        <div>
            <h1>Set Your Password</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    required
                />
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                />
                {error && <p className="error">{error}</p>}
                <button type="submit" disabled={!canSubmit || isLoading}>
                    {isLoading ? 'Setting password...' : 'Set Password'}
                </button>
            </form>
        </div>
    );
};
```

---

### STEP 6: Frontend - Routing

#### 6.1 React Router Setup

```typescript
// src/app/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/core/auth/ProtectedRoute';
import { SetupPasswordPage } from '@/core/auth/SetupPasswordPage';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/auth/setup-password',
        element: <SetupPasswordPage />,  // ⬅️ NEM protected!
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <DashboardPage /> },
            // ...
        ],
    },
]);
```

---

### STEP 7: Netlify SPA Routing

#### 7.1 _redirects fájl

```bash
# public/_redirects
/*    /index.html   200
```

Ez biztosítja hogy minden URL az `index.html`-re irányítson (SPA routing).

---

## 🐛 Troubleshooting Checklist

### ❌ "Error sending invite email"

**Diagnózis:**
```bash
# Supabase Edge Function logs-ban keress:
error: "dial tcp: lookup smtp.gmail.com  : no such host"
```

**Ok:** WHITESPACE az SMTP Host mezőben

**Megoldás:**
1. Töröld ki az SMTP Host mezőt
2. Írd be újra (NE copy-paste!): `smtp.gmail.com`
3. Save

---

### ❌ "Site not found" (Netlify 404)

**Ok:** Rossz domain név a `SITE_URL`-ben

**Megoldás:**
1. Ellenőrizd a pontos domain nevet (pl. `myapp` vs `my-app`)
2. Frissítsd a `SITE_URL` environment változót
3. Redeploy Edge Function
4. Frissítsd Supabase URL Configuration-t

---

### ❌ User simán beenged jelszó nélkül

**Diagnózis:**
```javascript
// Browser console
supabase.auth.getUser().then(({data}) =>
  console.log(data.user?.user_metadata?.password_set)
)
// Eredmény: undefined (kellene: false)
```

**Ok:** `password_set` flag nincs beállítva VAGY Netlify deploy failed

**Megoldás:**
1. Ellenőrizd Netlify deploy státuszt (legyen zöld pipa)
2. Hard refresh (Cmd+Shift+R)
3. Töröld a régi invited usert
4. Hívj meg ÚJ usert (új Edge Function kóddal)

---

### ❌ Netlify deploy failed (TypeScript error)

**Error:**
```
error TS6133: '...' is declared but its value is never read.
```

**Ok:** Unused imports

**Megoldás:**
- Távolítsd el az összes unused import-ot
- Commit + push

---

## 🎯 Best Practices

### 1. Security
- ✅ Service role key CSAK Edge Function-ben
- ✅ SMTP password environment változóban
- ✅ Kötelező jelszó beállítás invited usereknek
- ✅ HTTPS mindenhol

### 2. UX
- ✅ Toast notifications (success/error)
- ✅ "Meghívva" badge a user listában
- ✅ Jelszó erősség indikátor
- ✅ Email konfirmáció

### 3. Code Quality
- ✅ TypeScript strict mode
- ✅ Error handling minden async operation-nél
- ✅ Loading states
- ✅ Consistent naming conventions

### 4. Testing
- ✅ Teljes flow teszt (meghívás → email → jelszó → login)
- ✅ Edge case-ek (duplikált email, hibás jelszó, stb.)
- ✅ Browser compatibility
- ✅ Mobile responsive

---

## 📚 Referenciák

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Netlify Redirects](https://docs.netlify.com/routing/redirects/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

## 🔄 Változtatások (Changelog)

### v1.0.0 (2026-02-23)
- ✅ Kezdeti verzió
- ✅ Gmail SMTP integráció
- ✅ Persistent `password_set` flag
- ✅ ProtectedRoute mandatory password setup
- ✅ Teljes troubleshooting guide

---

**Készítette:** Claude Sonnet 4.5
**Projekt:** AlApp (referencia implementáció)
**Licenc:** MIT (szabadon felhasználható)

---

## 💡 Használat más projektekben

1. **Másold ezt a fájlt** az új projektbe
2. **Kövesd a lépéseket** fentről
3. **Customize-old** a projekt igényei szerint:
   - Domain nevek
   - Email template-ek
   - UI komponensek
   - Role-ok (admin, user, stb.)

4. **Tesztelj mindent** a Troubleshooting checklist alapján

**Happy coding!** 🚀
