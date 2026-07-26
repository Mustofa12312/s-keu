import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kpjvngkgtpetnksfzdfh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanZuZ2tndHBldG5rc2Z6ZGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzQxOTQsImV4cCI6MjA5NDkxMDE5NH0.mS9FQPect6r7pirJnx78Um74LI8QoaD8unKG_3TzpUA'

const tempClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const mainClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)

async function test() {
  console.log("Signing in as superadmin to get session...")
  // We can't easily sign in as super admin because we don't know the password
  // But we can check if signUp itself is throwing the error
  console.log("Trying to sign up a test user...")
  const email = `test_${Date.now()}@test.com`
  const { data, error } = await tempClient.auth.signUp({
    email,
    password: 'password123',
    options: { data: { nama: 'Test User' } },
  })
  
  if (error) {
    console.error("SignUp Error:", error)
    return
  }
  
  console.log("SignUp Success! User ID:", data.user.id)
  
  // Now let's try upsert without authentication (should fail with RLS)
  console.log("Trying upsert...")
  const { error: upsertError } = await mainClient.from('profiles').upsert({
    id: data.user.id,
    nama: 'Test User',
    email: email,
    role: 'viewer',
    instansi_id: null,
    akses_menu: ['/dashboard']
  })
  
  if (upsertError) {
    console.error("Upsert Error (Expected if no session):", upsertError)
  } else {
    console.log("Upsert Success?!")
  }
}

test()
