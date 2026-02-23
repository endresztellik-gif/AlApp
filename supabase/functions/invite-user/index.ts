import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the access token JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile', details: profileError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can invite users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Get request body
    const { email, fullName, role } = await req.json()

    if (!email || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, fullName, role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create admin client with service role key
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

    // Check if user already exists
    const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers.some(u => u.email === email)

    if (userExists) {
      return new Response(
        JSON.stringify({ error: 'Ez az email cím már használatban van.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create user without sending email (since SMTP is not configured)
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: false, // Don't send confirmation email
      user_metadata: {
        full_name: fullName,
        role: role
      }
    })

    if (createError) {
      console.error('Create user error:', createError)
      return new Response(
        JSON.stringify({
          error: createError.message || 'Hiba történt a felhasználó létrehozása során.',
          details: createError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!newUserData.user) {
      return new Response(
        JSON.stringify({ error: 'Nem sikerült létrehozni a felhasználót.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create user profile in user_profiles table
    const { error: profileInsertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: newUserData.user.id,
        email: email,
        full_name: fullName,
        role: role,
        is_active: true
      })

    if (profileInsertError) {
      console.error('Profile insert error:', profileInsertError)
      // Try to delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(newUserData.user.id)

      return new Response(
        JSON.stringify({
          error: 'Hiba történt a felhasználói profil létrehozása során.',
          details: profileInsertError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Generate password reset link (this works without SMTP configured)
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') || Deno.env.get('VITE_APP_URL') || 'http://localhost:5173'}/auth/setup-password`
      }
    })

    if (resetError) {
      console.error('Generate link error:', resetError)
      // User is created, but we couldn't generate the magic link
      // Still return success, admin can manually send invite later
    }

    console.log('User created successfully:', email)

    return new Response(
      JSON.stringify({
        success: true,
        user: newUserData.user,
        magicLink: resetData?.properties?.action_link || null,
        message: resetData?.properties?.action_link
          ? 'Felhasználó létrehozva. Küld el neki ezt a linket: ' + resetData.properties.action_link
          : 'Felhasználó létrehozva, de az email küldés jelenleg nem elérhető. Kérlek állítsd be az SMTP-t a Supabase Dashboard-on.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
