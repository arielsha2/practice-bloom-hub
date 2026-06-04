import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const secret = req.headers.get('x-internal-secret')
    if (secret !== Deno.env.get('INTERNAL_WEBHOOK_SECRET')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, full_name, transaction_id } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (transaction_id) {
      const { data: existing } = await supabaseAdmin
        .from('student_enrollments')
        .select('id')
        .eq('notes', `meshulam:${transaction_id}`)
        .maybeSingle()

      if (existing) {
        return new Response(
          JSON.stringify({ success: true, note: 'already_processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const { error: enrollError } = await supabaseAdmin
      .from('student_enrollments')
      .insert({
        email: email.toLowerCase(),
        full_name: full_name || null,
        course_key: 'turning_point',
        pending_role: 'course_member',
        pending_mentor: true,
        notes: transaction_id ? `meshulam:${transaction_id}` : 'meshulam:manual',
      })

    if (enrollError) {
      console.error('Enrollment error:', enrollError)
      return new Response(
        JSON.stringify({ error: enrollError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!userExists) {
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://therapykeys.co.il/auth?mode=reset',
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
