// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

// Utilisation de Deno.serve pour démarrer le serveur HTTP
Deno.serve(async (req: Request) => {
  try {
    const { name } = await req.json()

    if (!name) {
      return new Response(
        JSON.stringify({ error: "Missing 'name' field" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const data = {
      message: `Hello ${name}!`,
    }

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})

/* Pour tester localement :

1. Lance la stack Supabase :
   supabase start

2. Envoie une requête POST :

curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-user' \
  --header 'Authorization: Bearer <ton_token>' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Functions"}'

*/
