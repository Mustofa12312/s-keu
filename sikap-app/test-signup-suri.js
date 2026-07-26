import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kpjvngkgtpetnksfzdfh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanZuZ2tndHBldG5rc2Z6ZGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzQxOTQsImV4cCI6MjA5NDkxMDE5NH0.mS9FQPect6r7pirJnx78Um74LI8QoaD8unKG_3TzpUA'

const tempClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

async function test() {
  console.log("Mencoba membuat user suri3@gmail.com...")
  const { data, error } = await tempClient.auth.signUp({
    email: 'suri3@gmail.com',
    password: 'password123',
    options: { data: { nama: 'Ust Suri 3' } },
  })
  
  if (error) {
    console.error("GAGAL!", error)
  } else {
    console.log("BERHASIL! ID User:", data?.user?.id)
  }
}

test()
