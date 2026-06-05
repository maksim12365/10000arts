export default async function handler(req, res) {
  // Получаем URL базы из переменных окружения
  const databaseUrl = process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    return res.status(500).json({ error: 'Database URL not configured' });
  }

  try {
    if (req.method === 'GET') {
      // Прямой HTTP запрос к Neon
      const response = await fetch(databaseUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Neon-Connection-String': databaseUrl
        },
        body: JSON.stringify({
          sql: "SELECT * FROM cells WHERE status = 'active' ORDER BY id ASC",
        })
      });
      
      const result = await response.json();
      return res.status(200).json(result.rows || []);
    }
    
    if (req.method === 'POST') {
      const { x, y, image_data } = req.body;
      
      const response = await fetch(databaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: "INSERT INTO cells (x, y, image_data, status, report_count) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          args: [x, y, image_data, 'active', 0]
        })
      });
      
      const result = await response.json();
      return res.status(201).json(result.rows?.[0] || {});
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
