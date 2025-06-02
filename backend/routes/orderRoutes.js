const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
  try {
    const { items, billing, payment } = req.body;
    const order = new Order({
      items,
      billing,
      payment,
      status: 'pending',
      trackingInfo: {
        trackingNumber: Math.random().toString(36).substring(7).toUpperCase(),
        carrier: 'Express Delivery',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        updates: [{
          status: 'Order Received',
          location: 'Processing Center',
          timestamp: new Date()
        }]
      }
    });
    await order.save();
    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order._id,
      trackingNumber: order.trackingInfo.trackingNumber
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

// GET /api/orders/track/:trackingNumber - Track order by tracking number
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ 'trackingInfo.trackingNumber': req.params.trackingNumber });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({
      status: order.status,
      trackingInfo: order.trackingInfo,
      billing: {
        firstName: order.billing.firstName,
        lastName: order.billing.lastName
      }
    });
  } catch (error) {
    console.error('Order tracking error:', error);
    res.status(500).json({ message: 'Error tracking order', error: error.message });
  }
});

// GET /api/orders/:id - Get order details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

module.exports = router; 