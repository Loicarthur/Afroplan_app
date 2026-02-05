import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"



serve(async (req: Request) => {
  try {
    const { email, password, username } = await req.json()

    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 1️⃣ Create Auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400 }
      )
    }

    // 2️⃣ Insert profile
    const { error: dbError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        username,
      })

    if (dbError) {
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { status: 400 }
      )
    }

    return new Response(
      JSON.stringify({
        message: "User created successfully 🚀",
        userId: authData.user.id,
      }),
      { status: 201 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400 }
    )
  }
})
