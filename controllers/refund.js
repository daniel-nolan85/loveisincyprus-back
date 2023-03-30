const Refund = require('../models/refund');
const User = require('../models/user');
const Order = require('../models/order');
const cloudinary = require('cloudinary');
const nodemailer = require('nodemailer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.requestRefund = async (req, res) => {
  const { _id, items, reason, refundImages, refundAmount, orderedBy } =
    req.body;
  const itemIds = items.map((item) => item.split('-')[0]);
  const countMap = {};

  itemIds.forEach((item) => {
    countMap[item] = (countMap[item] || 0) + 1;
  });
  for (const productId in countMap) {
    const count = countMap[productId];
    const order = await Order.updateOne(
      { _id, 'products.product': productId },
      { $inc: { 'products.$.refunded': count } }
    );
  }

  const itemsNoIndex = items.map((item) => item.replace(/-\d+/, ''));
  const toBeRefunded = itemsNoIndex.reduce((count, value) => {
    count[value] = (count[value] || 0) + 1;
    return count;
  }, {});
  const refundedItems = Object.entries(toBeRefunded).map(([key, value]) => {
    const [id, price, title] = key.split(', ');
    return { id, price, title, quantity: value };
  });

  try {
    if (!items.length) {
      res.json({
        error: 'Product is required',
      });
    }
    if (!reason) {
      res.json({
        error: 'Reason is required',
      });
    } else {
      const refund = new Refund({
        reason,
        items: itemIds,
        refundImages,
        refundAmount,
        orderedBy,
      });
      refund.save();
    }

    const user = await User.findById(orderedBy).select('email');
    const listItems = refundedItems.map((p) => {
      return `
      <tr>
        <td>${p.title}</td>
        <td>€${p.price}</td>
        <td>${p.quantity}</td>
      </tr>`;
    });

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'customercare@loveisincyprus.com',
        pass: process.env.GMAIL_AUTHORIZATION,
      },
      secure: true,
    });

    let mailOptions = {
      from: 'customercare@loveisincyprus.com',
      to: user.email,
      subject: 'Refund request from Love Is In Cyprus',
      html: `
    <h3 style="margin-bottom: 5px;">Your recent request for a refund has been received</h3>
    <p style="margin-bottom: 5px;">Order ID: <span style="font-weight: bold">${_id}</span></p>
    <p style="margin-bottom: 5px;">Your recent request for a refund for the following items has been received:</p>
    <table style="border-spacing: 20px; border-collapse: separate; margin-bottom: 5px;">
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${listItems}
      </tbody>
    </table>
    <p style="margin-bottom: 5px;">These items have an accumulated refund value of €${refundAmount} after reduction handling charges.</p>
    <p style="margin-bottom: 5px;">Please return your unwanted items to us at the following address:</p>
    <br/>
    <p>WOLF</p>
    <p>Agiou Athanasiou 16-2</p>
    <p>8560 Peyia</p>
    <p>Cyprus</p>
    <br/>
    <p style="margin-bottom: 5px;">Your refund will be returned to the bank account your purchase was made with within 30 days from receipt of the goods by us.</p>
    <h3>Thank you for shopping with us!</h3>
    `,
    };

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        res.send(err);
      } else {
        res.send('Success');
      }
    });
    transporter.close();
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};
