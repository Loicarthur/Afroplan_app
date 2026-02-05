import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Gerer les requetes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, fullName, phone, role } = await req.json()

    // Validation des champs requis
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, mot de passe et nom complet sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Valider le role
    const validRole = (role === 'client' || role === 'coiffeur') ? role : 'client'

    // Client admin avec service_role key (disponible automatiquement dans les Edge Functions)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Creer l'utilisateur via l'API admin (bypass le trigger)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
        role: validRole,
      },
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Creer le profil directement (upsert pour eviter les doublons si le trigger a marche)
    if (userData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: email.toLowerCase(),
          full_name: fullName,
          phone: phone || null,
          role: validRole,
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Erreur creation profil:', profileError.message)
        // Ne pas echouer la requete - l'utilisateur est deja cree
      }
    }

    return new Response(
      JSON.stringify({
        user: userData.user,
        message: 'Utilisateur cree avec succes',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
