// The project's public read access, used by the edge functions that read published articles. The key is the public
// (anon) key the site ships to every browser; reads are limited by row-level security, which lets anyone read
// published articles only.
export const SUPABASE_URL = "https://umtqmhzzxbfvokbiwsmr.supabase.co";
export const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdHFtaHp6eGJmdm9rYml3c21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjI5ODIsImV4cCI6MjA4MjIzODk4Mn0.lVF-CCkqp0VlTjCmXbVKhYIjBrp9y7_hWacMHk7AxCE";
