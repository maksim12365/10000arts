// /pages/api/cells.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { method } = req;
  
  // 🔹 GET - загрузка всех ячеек
  if (method === 'GET') {
    try {
      // Фильтры из запроса (как в Supabase)
      const { status, x, y, order } = req.query;
      
      let query = 'SELECT * FROM cells WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (x !== undefined) {
        query += ` AND x = $${paramIndex++}`;
        params.push(parseInt(x));
      }
      if (y !== undefined) {
        query += ` AND y = $${paramIndex++}`;
        params.push(parseInt(y));
      }
      
      if (order === 'created_at.asc') {
        query += ' ORDER BY created_at ASC';
      } else if (order === 'created_at.desc') {
        query += ' ORDER BY created_at DESC';
      }
      
      const result = await sql.query(query, params);
      return res.status(200).json(result.rows);
      
    } catch (error) {
      console.error('GET error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // 🔹 POST - сохранение новой ячейки
  if (method === 'POST') {
    try {
      const { x, y, image_data, status = 'active', report_count = 0 } = req.body;
      
      const result = await sql.query(
        `INSERT INTO cells (x, y, image_data, status, report_count) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [x, y, image_data, status, report_count]
      );
      
      return res.status(201).json(result.rows[0]);
      
    } catch (error) {
      console.error('POST error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // 🔹 PATCH - обновление (для жалоб)
  if (method === 'PATCH') {
    try {
      const { x, y } = req.query;
      const { report_count } = req.body;
      
      const result = await sql.query(
        `UPDATE cells SET report_count = $1 WHERE x = $2 AND y = $3 RETURNING *`,
        [report_count, parseInt(x), parseInt(y)]
      );
      
      return res.status(200).json(result.rows[0]);
      
    } catch (error) {
      console.error('PATCH error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
