const Refund = require('../models/refund');
const User = require('../models/user');
const Order = require('../models/order');
const cloudinary = require('cloudinary');
const nodemailer = require('nodemailer');
const Cardinity = require('cardinity-nodejs');
const axios = require('axios');

const Client = Cardinity.client();
const RefundMember = Cardinity.refund();

const client = new Client(
  process.env.CARDINITY_KEY,
  process.env.CARDINITY_SECRET
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.requestRefund = async (req, res) => {
  const {
    _id,
    items,
    reason,
    refundImages,
    amountRequested,
    orderedBy,
    paymentIntent,
  } = req.body;
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
        amountRequested,
        orderedBy,
        paymentIntent,
        refundStatus: 'requested',
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

    let emailAdmin = {
      from: 'customercare@loveisincyprus.com',
      to: 'william.wolf@mac.com',
      subject: 'New refund was requested on Love Is In Cyprus',
      html: `
    <h3 style="margin-bottom: 5px;">You have received a new refund request</h3>
    <p style="margin-bottom: 5px;">Order ID: <span style="font-weight: bold">${paymentIntent.id}</span></p>
    <p style="margin-bottom: 5px;">User has requested a refund for the following items:</p>
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
    <p style="margin-bottom: 5px;">User has given the following reason for the return:</p>
    <p style="margin-bottom: 5px; margin-left: 10px; font-weight: bold;">${reason}</p>
    <p style="margin-bottom: 5px;">These items have an accumulated refund value of €${amountRequested} after reduction of handling charges.</p>
    `,
    };

    let emailUser = {
      from: 'customercare@loveisincyprus.com',
      to: user.email,
      subject: 'Refund request from Love Is In Cyprus',
      html: `
    <h3 style="margin-bottom: 5px;">Your recent request for a refund has been received</h3>
    <p style="margin-bottom: 5px;">Order ID: <span style="font-weight: bold">${paymentIntent.id}</span></p>
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
    <p style="margin-bottom: 5px;">These items have an accumulated refund value of €${amountRequested} after reduction of handling charges.</p>
    <p style="margin-bottom: 5px;">Please return your unwanted items to our goods department at the following address:</p>
    <br/>
    <p>WOLF</p>
    <p>Agiou Athanasiou 16-2</p>
    <p>8560 Peyia</p>
    <p>Cyprus</p>
    <br/>
    <p style="margin-bottom: 5px; text-transform: uppercase; color: #ff0e0e; font-size: 25px; font-weight: bold;">You must include your Order Id with your return, failure to do so may result in your request being rejected.<p>
    <p style="margin-bottom: 5px;">Your request will be inspected upon our receipt of the items and, if granted, your refund will be returned to the bank account your purchase was made with no more than 30 days later.</p>
    <h3>Thank you for shopping with us!</h3>
    `,
    };

    // const emails = [emailAdmin, emailUser];
    const emails = [emailUser];

    for (let i = 0; i < emails.length; i++) {
      transporter.sendMail(emails[i], (err, response) => {
        if (err) {
          res.send(err);
        } else {
          res.send('Success');
        }
      });
    }

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
        $set: { returned: false, refundStatus: 'requested' },
      },
      { new: true }
    );
    res.json(returned);
  } catch (err) {
    console.log(err);
  }
};

exports.rejectRefund = async (req, res) => {
  const { _id, items, orderedBy, paymentIntent } = req.body.refund;
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

    const reason = req.body.reason
      ? `
        <p style="margin-bottom: 5px;">Your request was rejected for the following reason:</p>
        <p style="margin-bottom: 5px;">${req.body.reason}</p>
      `
      : '';

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
      subject: 'Your refund has been rejected',
      html: `
    <h3 style="margin-bottom: 5px;">Your recent request for a refund has been rejected</h3>
    <p style="margin-bottom: 5px;">Order ID: <span style="font-weight: bold">${paymentIntent.id}</span></p>
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
    ${reason}
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
  const { refund, message, refundAmount, products } = req.body;
  const messageToBuyer = message || 'No message was sent';
  console.log('processRefund => ', req.body);
  try {
    const returned = await Refund.findByIdAndUpdate(
      refund._id,
      {
        $push: { refundedItems: products, messages: messageToBuyer },
      },
      { new: true }
    );
    if (returned.refundedItems.length === returned.items.length) {
      returned.refundStatus = 'granted';
    } else {
      returned.refundStatus = 'partial';
    }

    const amounts = returned.refundedItems.map((refundedItem) =>
      Number(refundedItem.split(', ')[1])
    );
    const amountSum = amounts.reduce((acc, amount) => acc + amount, 0);
    const tenPercent = amountSum * 0.1;
    const calc = amountSum - tenPercent;
    returned.amountGranted = calc;

    const updated = await returned.save();
    res.json(returned);

    const itemsNoIndex = products.map((item) => item.replace(/-\d+/, ''));
    const toBeRefunded = itemsNoIndex.reduce((count, value) => {
      count[value] = (count[value] || 0) + 1;
      return count;
    }, {});
    const refundedItems = Object.entries(toBeRefunded).map(([key, value]) => {
      const [id, price, title] = key.split(', ');
      return { id, price, title, quantity: value };
    });
    const listItems = refundedItems.map((p) => {
      return `
      <tr>
        <td>${p.title}</td>
        <td>€${p.price}</td>
        <td>${p.quantity}</td>
      </tr>`;
    });

    const additionalInfo = message
      ? `
        <p style="margin-bottom: 5px;">Additional information regarding this refund:</p>
        <p style="margin-bottom: 5px;">${message}</p>
      `
      : '';

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
      to: refund.orderedBy.email,
      subject: 'Your refund has been approved',
      html: `
    <p style="margin-bottom: 5px;">Order ID: <span style="font-weight: bold">${refund.paymentIntent.id}</span></p>
    <p style="margin-bottom: 5px;">Your recent request for a refund for the following items has been approved:</p>
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
    ${additionalInfo}
    <p style="margin-bottom: 5px;">Please note, we do charge a 10% handling fee for refunds as stipulated in our terms & conditions.</p>
    <p style="margin-bottom: 5px;">You will receive an amount of €${refundAmount} to the bank which made the initial transaction of this order within 30 days.</p>
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

    //   const refundMember = new RefundMember({
    //     amount: refundAmount,
    //     description:
    //       'User has requested a refund on their transaction and has been approved by admin',
    //     id: refund.paymentIntent.id,
    //   });

    //   client
    //     .call(refundMember)
    //     .then(async (response) => {
    //       console.log('response => ', response);
    //     })
    //     .catch((err) => {
    //       console.log(err);
    //     });
  } catch (err) {
    console.log(err);
  }
};

exports.emailBuyer = async (req, res) => {
  const { orderedBy, subject, message, refundImages } = req.body;

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'customercare@loveisincyprus.com',
      pass: process.env.GMAIL_AUTHORIZATION,
    },
    secure: true,
  });

  let attachments = [];
  if (refundImages.length > 0) {
    attachments = await Promise.all(
      refundImages.map(async (image, idx) => {
        const imageResponse = await axios.get(image.url, {
          responseType: 'arraybuffer',
        });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        return {
          filename: `image${idx + 1}.jpg`,
          content: imageBuffer,
        };
      })
    );
  }

  let mailOptions = {
    from: 'customercare@loveisincyprus.com',
    to: orderedBy.email,
    subject: subject,
    html: `
      <p>${message}</p>
      `,
    attachments,
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      res.send(err);
    } else {
      res.send('Success');
    }
  });
  transporter.close();
};
