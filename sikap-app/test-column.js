import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kpjvngkgtpetnksfzdfh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanZuZ2tndHBldG5rc2Z6ZGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzQxOTQsImV4cCI6MjA5NDkxMDE5NH0.mS9FQPect6r7pirJnx78Um74LI8QoaD8unKG_3TzpUA'

const client = createClient(SUPABASE_URL, SUPABASE_KEY)

async function test() {
  const { data, error } = await client.from('profiles').select('email').limit(1)
  if (error) {
    console.error("Column check error:", error)
  } else {
    console.log("Email column exists! Data:", data)
  }
}
test()
