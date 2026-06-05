export default async function handler(req, res) {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return res.status(500).json({ error: 'No database URL' });
  }

  try {
    if (req.method === 'GET') {
      // Прямой запрос к PostgreSQL через HTTP
      const response = await fetch(databaseUrl.replace('postgres://', 'https://') + '/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: "SELECT * FROM cells WHERE status = 'active' ORDER BY id ASC"
        })
      });
      
      const data = await response.json();
      return res.status(200).json(data.rows || data);
    }
    
    if (req.method === 'POST') {
      const { x, y, image_data } = req.body;
      
      const response = await fetch(databaseUrl.replace('postgres://', 'https://') + '/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: "INSERT INTO cells (x, y, image_data, status, report_count) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          params: [x, y, image_data, 'active', 0]
        })
      });
      
      const data = await response.json();
      return res.status(201).json(data.rows?.[0] || data);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
