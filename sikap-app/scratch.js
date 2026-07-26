import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  console.time('count')
  const { count } = await supabase.from('transaksi').select('*', { count: 'exact', head: true })
  console.timeEnd('count')
  console.log('Total transaksi:', count)
}
check()
