/**
 * Next.js API Route — Ideathon Durum Proxy
 * 
 * Backend'deki GET /api/ideathons/public/:slug endpoint'ini
 * sunucu tarafında çağırır. Böylece kullanıcı ağ trafiğinde
 * doğrudan backend URL'sini görmez.
 * 
 * Kullanım: GET /api/ideathon-status/ek-ideathon-2025
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ success: false, message: 'Slug gerekli' });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ideathons/public/${slug}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    // Cache 5 dk (backend de 5dk cache yapıyor)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Ideathon status fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ideathon durumu alınamadı',
    });
  }
}

