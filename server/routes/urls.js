import express from 'express';
import { z } from 'zod';
import os from 'os';
import prisma from '../prisma/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to get local network IP address
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // IPv4 loop check
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

// Get host LAN IP for Android scannable QR Code
router.get('/qr-host', requireAuth, (req, res) => {
  try {
    const lanIp = getLocalIp();
    res.status(200).json({ lanIp, port: 5173 });
  } catch (error) {
    console.error('LAN IP search error:', error);
    res.status(500).json({ error: 'Failed to read space grid LAN coordinates' });
  }
});

// Simple custom alphanumeric generator to avoid external dependency issues
const generateShortCode = (length = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// URL validation schema
const urlSchema = z.object({
  longUrl: z.string().url('Please enter a valid URL (include http:// or https://)'),
  customAlias: z.string().min(3, 'Custom alias must be at least 3 characters long').max(20, 'Custom alias must be at most 20 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Custom alias can only contain alphanumeric characters, hyphens, and underscores').optional().nullable().or(z.literal('')),
  expiresAt: z.string().datetime({ message: 'Invalid expiry date format' }).optional().nullable().or(z.literal('')),
});

// Edit URL destination schema
const editUrlSchema = z.object({
  longUrl: z.string().url('Please enter a valid URL (include http:// or https://)'),
});

// 1. Create a shortened URL
router.post('/shorten', requireAuth, async (req, res) => {
  try {
    const validated = urlSchema.parse(req.body);
    const userId = req.userId;

    let { longUrl, customAlias, expiresAt } = validated;

    // Check custom alias if provided
    if (customAlias) {
      const existingAlias = await prisma.url.findFirst({
        where: {
          OR: [
            { shortCode: customAlias },
            { customAlias: customAlias }
          ]
        }
      });
      if (existingAlias) {
        return res.status(400).json({ error: 'Custom alias or short code is already taken' });
      }
    }

    // Generate unique short code
    let shortCode = customAlias || '';
    if (!shortCode) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        shortCode = generateShortCode(6);
        const exists = await prisma.url.findFirst({
          where: {
            OR: [
              { shortCode },
              { customAlias: shortCode }
            ]
          }
        });
        if (!exists) {
          isUnique = true;
        }
        attempts++;
      }
      if (!isUnique) {
        return res.status(500).json({ error: 'Could not generate unique short code. Please try again.' });
      }
    }

    // Process expiry date
    let expiry = null;
    if (expiresAt) {
      expiry = new Date(expiresAt);
      if (expiry <= new Date()) {
        return res.status(400).json({ error: 'Expiry date must be in the future' });
      }
    }

    const newUrl = await prisma.url.create({
      data: {
        shortCode,
        longUrl,
        customAlias: customAlias || null,
        expiresAt: expiry,
        userId,
      },
    });

    res.status(201).json(newUrl);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Shorten error:', error);
    res.status(500).json({ error: 'Server error during URL shortening' });
  }
});

// 2. Edit a shortened URL destination
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validated = editUrlSchema.parse(req.body);
    const userId = req.userId;

    const existingUrl = await prisma.url.findUnique({
      where: { id }
    });

    if (!existingUrl) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (existingUrl.userId !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to modify this URL' });
    }

    const updatedUrl = await prisma.url.update({
      where: { id },
      data: {
        longUrl: validated.longUrl,
      }
    });

    res.status(200).json(updatedUrl);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Edit URL error:', error);
    res.status(500).json({ error: 'Server error while modifying URL destination' });
  }
});

// 3. Get all user URLs (or all URLs for admins)
router.get('/', requireAuth, async (req, res) => {
  try {
    const is_admin = req.userRole === 'ADMIN';
    const whereClause = is_admin ? {} : { userId: req.userId };

    const urls = await prisma.url.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { clicks: true }
        },
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format output
    const formattedUrls = urls.map(u => ({
      id: u.id,
      shortCode: u.shortCode,
      longUrl: u.longUrl,
      customAlias: u.customAlias,
      createdAt: u.createdAt,
      expiresAt: u.expiresAt,
      clickCount: u._count.clicks,
      userEmail: is_admin ? u.user.email : undefined,
    }));

    res.status(200).json(formattedUrls);
  } catch (error) {
    console.error('Get URLs error:', error);
    res.status(500).json({ error: 'Server error fetching URLs' });
  }
});

// 4. Delete URL
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const url = await prisma.url.findUnique({
      where: { id },
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (url.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    await prisma.url.delete({
      where: { id },
    });

    res.status(200).json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ error: 'Server error deleting URL' });
  }
});

// 5. Get URL Analytics
router.get('/:id/analytics', requireAuth, async (req, res) => {
  try {
    if (req.userRestricted && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'ACCESS DENIED: Your analytics access has been suspended by Command Administration.' });
    }

    const { id } = req.params;
    const url = await prisma.url.findUnique({
      where: { id },
      include: {
        clicks: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (url.userId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const totalClicks = url.clicks.length;
    const lastVisited = totalClicks > 0 ? url.clicks[0].timestamp : null;

    // Aggregate daily clicks (last 30 days)
    const dailyClicksMap = {};
    // Pre-populate last 7 days with 0s to make the chart look nice even if there are no clicks
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyClicksMap[dateStr] = 0;
    }

    // Fill in actual click counts
    url.clicks.forEach(click => {
      const dateStr = click.timestamp.toISOString().split('T')[0];
      if (dailyClicksMap[dateStr] !== undefined) {
        dailyClicksMap[dateStr]++;
      } else {
        dailyClicksMap[dateStr] = 1;
      }
    });

    const dailyTrends = Object.entries(dailyClicksMap)
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Aggregate Browser & Device analytics
    const browsers = {};
    const devices = {};

    url.clicks.forEach(click => {
      const b = click.browser || 'Unknown';
      const d = click.device || 'Desktop'; // Default to desktop if parsing couldn't decide
      browsers[b] = (browsers[b] || 0) + 1;
      devices[d] = (devices[d] || 0) + 1;
    });

    const browserData = Object.entries(browsers).map(([name, value]) => ({ name, value }));
    const deviceData = Object.entries(devices).map(([name, value]) => ({ name, value }));

    // Recent clicks (up to 30)
    const recentClicks = url.clicks.slice(0, 30).map(c => ({
      id: c.id,
      timestamp: c.timestamp,
      ip: c.ip,
      device: c.device,
      browser: c.browser,
      referrer: c.referrer,
    }));

    res.status(200).json({
      url: {
        id: url.id,
        shortCode: url.shortCode,
        longUrl: url.longUrl,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      },
      metrics: {
        totalClicks,
        lastVisited,
        dailyTrends,
        browserData,
        deviceData,
        recentClicks,
      },
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Server error retrieving analytics' });
  }
});

// 6. Bulk URL Shortening via JSON/CSV
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Payload must be an array of urls' });
    }

    const userId = req.userId;
    const results = [];

    for (const item of urls) {
      const longUrl = item.longUrl?.trim();
      let customAlias = item.customAlias?.trim() || null;
      let expiresAt = item.expiresAt?.trim() || null;

      if (!longUrl) {
        results.push({ success: false, longUrl: 'N/A', error: 'Missing longUrl field' });
        continue;
      }

      let formattedUrl = longUrl;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'http://' + formattedUrl;
      }

      try {
        new URL(formattedUrl);
      } catch (_) {
        results.push({ success: false, longUrl: longUrl, error: 'Invalid URL format' });
        continue;
      }

      if (customAlias) {
        const existingAlias = await prisma.url.findFirst({
          where: {
            OR: [
              { shortCode: customAlias },
              { customAlias: customAlias }
            ]
          }
        });
        if (existingAlias) {
          results.push({ success: false, longUrl: longUrl, error: `Alias '${customAlias}' is already taken` });
          continue;
        }
      }

      let expiry = null;
      if (expiresAt) {
        expiry = new Date(expiresAt);
        if (isNaN(expiry.getTime())) {
          results.push({ success: false, longUrl: longUrl, error: 'Invalid expiry date format' });
          continue;
        }
        if (expiry <= new Date()) {
          results.push({ success: false, longUrl: longUrl, error: 'Expiry date must be in the future' });
          continue;
        }
      }

      let shortCode = customAlias || '';
      if (!shortCode) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          shortCode = generateShortCode(6);
          const exists = await prisma.url.findFirst({
            where: {
              OR: [
                { shortCode },
                { customAlias: shortCode }
              ]
            }
          });
          if (!exists) {
            isUnique = true;
          }
          attempts++;
        }
        if (!isUnique) {
          results.push({ success: false, longUrl: longUrl, error: 'Failed to generate unique shortcode' });
          continue;
        }
      }

      try {
        const newUrl = await prisma.url.create({
          data: {
            shortCode,
            longUrl: formattedUrl,
            customAlias: customAlias || null,
            expiresAt: expiry,
            userId,
          },
        });
        results.push({ success: true, id: newUrl.id, shortCode: newUrl.shortCode, longUrl: newUrl.longUrl });
      } catch (dbError) {
        results.push({ success: false, longUrl: longUrl, error: 'Database error creating URL' });
      }
    }

    res.status(201).json(results);
  } catch (error) {
    console.error('Bulk shortening error:', error);
    res.status(500).json({ error: 'Server error during bulk URL shortening' });
  }
});

export default router;
