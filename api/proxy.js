export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const SUPABASE_URL = 'https://dshyrsxhqevvqbbqbnto.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHlyc3hocWV2dnFiYnFibnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDAyMzEsImV4cCI6MjA5MjM3NjIzMX0.Owrda92DRalj6uNzoMDUEkOEThfdNLtCn9m-5xM03q8';
  
  const url = new URL(req.url);
  const path = url.searchParams.get('path');
  
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(SUPABASE_URL + path, {
    method: req.method,
    headers: headers,
    body: req.method !== 'GET' ? await req.text() : undefined,
  });
  
  return new Response(response.body, {
    status: response.status,
    headers: Object.fromEntries(response.headers),
  });
}
