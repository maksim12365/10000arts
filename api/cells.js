// /api/cells.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Получаем строку подключения из переменных окружения
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    return res.status(500).json({ error: 'POSTGRES_URL not set' });
  }

  try {
    // Создаём клиент Neon
    const sql = neon(connectionString);

    if (req.method === 'GET') {
      // Загрузка ячеек
      const rows = await sql`
        SELECT * FROM cells 
        WHERE status = 'active' 
        ORDER BY id ASC
      `;
      return res.status(200).json(rows);
    }
    
    if (req.method === 'POST') {
      const { x, y, image_data } = req.body;
      
      // Сохранение ячейки
      const rows = await sql`
        INSERT INTO cells (x, y, image_data, status, report_count)
        VALUES (${x}, ${y}, ${image_data}, 'active', 0)
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }
    
    if (req.method === 'PATCH') {
      const { x, y } = req.query;
      const { report_count } = req.body;
      
      const rows = await sql`
        UPDATE cells 
        SET report_count = ${report_count}
        WHERE x = ${parseInt(x)} AND y = ${parseInt(y)}
        RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message,
      hint: 'Check POSTGRES_URL and table name'
    });
  }
}
