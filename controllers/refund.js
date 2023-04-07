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
    <p style="font-size: 18px; margin-bottom: 5px;">The status of your order is currently <span style="font-weight: bold;">pending</span>. We'll continue to notify you as this updates.</p>
    <p style="margin-bottom: 5px;">Your request will be inspected upon our receipt of the items and, if granted, your refund will be returned to the bank account your purchase was made with no more than 30 days later.</p>
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

exports.fetchRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find()
      .populate('orderedBy', '_id name email profileImage username mobile')
      .populate('items', '_id title price')
      .sort({ createdAt: -1 });
    res.json(refunds);
  } catch (err) {
    console.log(err);
  }
};

exports.itemsReturned = async (req, res) => {
  try {
    const returned = await Refund.findByIdAndUpdate(
      req.body.refund._id,
      {
        $set: { returned: true, refundStatus: 'pending' },
      },
      { new: true }
    );
    res.json(returned);
  } catch (err) {
    console.log(err);
  }
};

exports.itemsNotReturned = async (req, res) => {
  try {
    const returned = await Refund.findByIdAndUpdate(
      req.body.refund._id,
      {
        $set: { returned: false },
        $unset: { refundStatus: '' },
      },
      { new: true }
    );
    res.json(returned);
  } catch (err) {
    console.log(err);
  }
};

exports.rejectRefund = async (req, res) => {
  const { _id, items, orderedBy } = req.body.refund;
  try {
    const returned = await Refund.findByIdAndUpdate(
      _id,
      {
        $set: { refundStatus: 'denied' },
      },
      { new: true }
    );
    res.json(returned);

    const count = items.reduce((acc, item) => {
      const id = item._id;
      acc[id] = acc[id] ? acc[id] + 1 : 1;
      return acc;
    }, {});

    const result = items
      .map((item) => {
        const id = item._id;
        return {
          ...item,
          quantity: count[id],
        };
      })
      .filter((item, index, arr) => {
        return arr.findIndex((t) => t._id === item._id) === index;
      });

    const listItems = result.map((p) => {
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
      to: orderedBy.email,
      subject: 'Refund request from Love Is In Cyprus',
      html: `
    <h3 style="margin-bottom: 5px;">Your recent request for a refund has been rejected</h3>
    <p style="margin-bottom: 5px;">Order ID: <span style="font-weight: bold">${_id}</span></p>
    <p style="margin-bottom: 5px;">Your recent request for a refund for the following items has been rejected:</p>
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
    <br/>
    <p style="margin-bottom: 5px;">Your request was rejected for the following reason:</p>
    <p style="margin-bottom: 5px;">${req.body.reason}</p>
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
  }
};

exports.processRefund = async (req, res) => {
  // console.log('processRefund => ', req.body);
  const { refund, reason, refundAmount, products } = req.body;
  try {
    const returned = await Refund.findByIdAndUpdate(
      refund._id,
      {
        $push: { refundedItems: products },
      },
      { new: true }
    );
    if (returned.refundedItems.length === returned.items.length) {
      returned.refundStatus = 'granted';
    } else {
      returned.refundStatus = 'partial';
    }
    const updated = await returned.save();
    res.json(returned);
  } catch (err) {
    console.log(err);
  }
};
