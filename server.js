// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Minimal checkout endpoint: validates cart and creates a Stripe Checkout session.
// NOTE: You must validate prices on the server in production.
app.post('/api/checkout', async (req, res) => {
  try {
    const { cart } = req.body;
    if (!cart || Object.keys(cart).length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Build Stripe line_items from cart
    const line_items = Object.values(cart).map(item => ({
      price_data: {
        currency: 'php',
        unit_amount: Math.round(Number(item.price) * 100), // price in cents
        product_data: {
          name: item.name,
          images: item.img ? [item.img] : []
        }
      },
      quantity: item.qty || 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: process.env.SUCCESS_URL || 'http://localhost:3000/success.html',
      cancel_url: process.env.CANCEL_URL || 'http://localhost:3000/'
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Checkout server listening on ${PORT}`));