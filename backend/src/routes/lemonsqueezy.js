const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/', (req, res) => {
  const signature = req.headers['x-signature'];
  const secret = process.env.LEMONSQUEEZY_SIGNING_SECRET;

  if (!signature || !secret) {
    return res.status(400).send('Missing signature');
  }

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (hmac !== signature) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(req.body.toString());
  const event = payload.meta.event_name;

  console.log('📩 Lemon event:', event);

  // نهمّنا الاشتراك الناجح فقط
  if (event === 'subscription_created' || event === 'subscription_payment_success') {
    const email = payload.data.attributes.user_email;

    const token = jwt.sign(
      { premium: true, email },
      process.env.PREMIUM_JWT_SECRET,
      { expiresIn: '365d' }
    );

    console.log('✅ Premium activated for:', email);
    console.log('TOKEN:', token);
  }

  res.status(200).json({ received: true });
});

module.exports = router;
