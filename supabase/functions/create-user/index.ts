import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, fullName, phone, role } = await req.json()

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Email, mot de passe et nom complet sont requis" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validRole = (role === 'client' || role === 'coiffeur') ? role : 'client'

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 1. Creer l'utilisateur auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: phone || null,
          role: validRole,
        },
      })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Creer le profil dans la table profiles (upsert si le trigger l'a deja cree)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone || null,
        role: validRole,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Erreur creation profil:', profileError.message)
      // Ne pas echouer - l'utilisateur auth est deja cree
    }

    return new Response(
      JSON.stringify({
        user: authData.user,
        message: "Utilisateur cree avec succes",
        userId: authData.user.id,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Corps JSON invalide" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
