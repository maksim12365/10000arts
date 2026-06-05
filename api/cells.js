import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM cells WHERE status = 'active' ORDER BY id ASC`;
      return res.status(200).json(result.rows);
    }
    
    if (req.method === 'POST') {
      const { x, y, image_data } = req.body;
      const result = await sql`
        INSERT INTO cells (x, y, image_data, status, report_count)
        VALUES (${x}, ${y}, ${image_data}, 'active', 0)
        RETURNING *
      `;
      return res.status(201).json(result.rows[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
