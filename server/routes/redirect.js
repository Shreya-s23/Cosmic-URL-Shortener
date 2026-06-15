import express from 'express';
import UAParser from 'ua-parser-js';
import prisma from '../prisma/db.js';

const router = express.Router();

router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Search database for the shortCode
    const url = await prisma.url.findFirst({
      where: {
        OR: [
          { shortCode: shortCode },
          { customAlias: shortCode }
        ]
      },
      include: {
        user: {
          select: { restricted: true }
        }
      }
    });

    // Handle 404 (Not Found)
    if (!url) {
      // Redirect to frontend client 404 page
      return res.redirect('/not-found');
    }

    // Handle Deactivated / Suspended Creator
    if (url.user?.restricted) {
      return res.redirect(`/expired?code=${shortCode}&reason=suspended`);
    }

    // Handle Expiration
    if (url.expiresAt && new Date(url.expiresAt) <= new Date()) {
      // Redirect to frontend client link expired page
      return res.redirect(`/expired?code=${shortCode}`);
    }

    // Parse request metadata for analytics
    const userAgentStr = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
    
    // Parse IP Address
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (Array.isArray(ip)) ip = ip[0];
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    // Normalize IPv6 local address to IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }

    // Parse User Agent using ua-parser-js
    const parser = new UAParser(userAgentStr);
    const uaResult = parser.getResult();
    
    const browser = uaResult.browser.name || 'Unknown';
    let device = 'Desktop';
    if (uaResult.device.type) {
      const type = uaResult.device.type;
      device = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize (Mobile, Tablet, etc.)
    }

    // Log the click event (non-blocking for redirect, but with error trapping)
    try {
      await prisma.click.create({
        data: {
          urlId: url.id,
          ip,
          userAgent: userAgentStr,
          device,
          browser,
          referrer,
        }
      });
    } catch (dbError) {
      console.error('Failed to log click event to database:', dbError);
    }

    // Perform the Server-Side Redirect (302 Found)
    return res.redirect(302, url.longUrl);

  } catch (error) {
    console.error('Redirect handler error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
