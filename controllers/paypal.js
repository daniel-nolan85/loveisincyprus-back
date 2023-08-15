const User = require('../models/user');
const Cart = require('../models/cart');
const axios = require('axios');
const nodemailer = require('nodemailer');
const moment = require('moment');

const { PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;
const base = 'https://api-m.sandbox.paypal.com';

exports.calculateFinalAmount = async (req, res) => {
  const { coupon } = req.body;
  const user = await User.findOne({ mobile: req.user.phone_number })
    .select('_id')
    .exec();
  const { cartTotal, totalAfterDiscount } = await Cart.findOne({
    orderedBy: user._id,
  }).exec();

  let finalAmount = 0;
  if (
    coupon &&
    totalAfterDiscount !== undefined &&
    totalAfterDiscount !== null
  ) {
    finalAmount = totalAfterDiscount * 100;
  } else {
    finalAmount = cartTotal * 100;
  }

  res.send({
    cartTotal,
    totalAfterDiscount,
    payable: finalAmount,
  });
};

exports.createPayPalOrder = async (req, res) => {
  console.log('createPayPalOrder => ', req.body);
  const { product } = req.body;
  const { description, value } = product;
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  try {
    const response = await axios.post(
      url,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'EUR',
              value,
            },
            description,
          },
        ],
        // payee,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.json(handleResponse(response));
  } catch (err) {
    // Handle any errors from the request or DB updates
    console.log('Error creating PayPal order:');
    throw new Error('Error creating PayPal order');
  }
};

exports.createPayPalAuthorization = async (req, res) => {
  console.log('createPayPalAuthorization => ', req.body);
  const { product } = req.body;
  const { description, value } = product;
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  try {
    const response = await axios.post(
      url,
      {
        intent: 'AUTHORIZE',
        purchase_units: [
          {
            amount: {
              currency_code: 'EUR',
              value,
            },
            description,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log('response => ', response);

    return res.json(handleResponse(response));
  } catch (err) {
    // Handle any errors from the request or DB updates
    console.log('Error creating PayPal order:');
    throw new Error('Error creating PayPal order');
  }
};

exports.capturePayPalShopOrder = async (req, res) => {
  const { orderID } = req.body;
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;
  try {
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(handleResponse(response));
  } catch (err) {
    // Handle any errors from the request or DB updates
    console.log('Error capturing PayPal shop order:', err);
    throw new Error('Error capturing PayPal shop order');
  }
};

exports.capturePayPalSubOrder = async (req, res) => {
  const { orderID, _id, payable, daysLeft } = req.body;
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;
  try {
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captureId = response.data.purchase_units[0].payments.captures[0].id;

    let days = 0;
    if (payable === '10.00') {
      days = 30;
    } else if (payable === '50.00') {
      days = 180;
    } else {
      days = 365;
    }

    if (daysLeft > 0) {
      days += daysLeft;
    }

    const amendMembership = await User.findByIdAndUpdate(
      { _id },
      {
        'membership.paid': true,
        'membership.trialPeriod': true,
        'membership.startDate': new Date(Date.now()),
        'membership.expiry': new Date(Date.now() + days * 24 * 3600 * 1000),
        'membership.captureId': captureId,
        'membership.cost': payable,
      },
      { new: true }
    )
      .select('membership email')
      .exec();

    res.json({
      amendMembership,
      responseData: handleResponse(response),
    });

    const fortnight = new Date(Date.now() + 12096e5);

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
      to: amendMembership.email,
      subject: 'Thanks for subscribing',
      html: `
              <h3 style="margin-bottom: 5px;">Thank you for becoming a subscribed member of Love Is In Cyprus</h3>
              <p style="margin-bottom: 5px;">Your payment has been successfully authorised and you will now receive full access to all areas of the site until ${moment(
                amendMembership.membership.expiry
              ).format('MMMM Do YYYY')}</p>
              <p>Should you decide you'd like to cancel, please contact us anytime between now and ${moment(
                fortnight
              ).format(
                'MMMM Do YYYY'
              )} to receive a full refund, no questions asked.</p>
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
    // Handle any errors from the request or DB updates
    console.log('Error capturing PayPal subscription order:', err);
    throw new Error('Error capturing PayPal subscription order');
  }
};

exports.refundPayPalSubOrder = async (req, res) => {
  const { _id, captureId } = req.body;
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/payments/captures/${captureId}/refund`;
  try {
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const cancelSubscription = await User.findByIdAndUpdate(
      {
        _id,
      },
      {
        'membership.paid': false,
        'membership.trialPeriod': false,
        'membership.cost': '0.00',
        'membership.captureId': '',
        'membership.expiry': new Date(Date.now()),
      },
      { new: true }
    )
      .select('membership')
      .exec();

    res.json({
      cancelSubscription,
      responseData: handleResponse(response),
    });
  } catch (err) {
    // Handle any errors from the request or DB updates
    console.log('Error creating PayPal subscription refund:', err);
    throw new Error('Error creating PayPal subscription refund');
  }
};

exports.capturePayPalGCOrder = async (req, res) => {
  const { orderID } = req.body;
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;
  try {
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(handleResponse(response));
  } catch (err) {
    // Handle any errors from the request or DB updates
    console.log('Error capturing PayPal gift card order:', err);
    throw new Error('Error capturing PayPal gift card order');
  }
};

exports.authorizePayPalAdOrder = async (req, res) => {
  const { orderID } = req.body;
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/authorize`;
  try {
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('authorizePayPalAdOrder => ', response);
    res.json(handleResponse(response));
  } catch (err) {
    console.log('Error authorizing PayPal ad order:', err);
    throw new Error('Error authorizing PayPal ad order');
  }
};

exports.capturePayPalAdAuthorization = async (req, res) => {
  const { authId } = req.body;
  const accessToken = await generateAccessToken();
  const checkStatus = `${base}/v2/payments/authorizations/${authId}`;
  const statusResponse = await axios.get(checkStatus, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const createTime = statusResponse.data.create_time;
  const withinHonorPeriod = isAuthorizationWithinHonorPeriod(createTime);

  if (withinHonorPeriod) {
    const url = `${base}/v2/payments/authorizations/${authId}/capture `;
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(handleResponse(response));
  } else {
    const reauthorize = `${base}/v2/payments/authorizations/${authId}/reauthorize `;
    const reauthResponse = await axios.post(reauthorize, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const newAuthId = reauthResponse.data.id;

    const capture = `${base}/v2/payments/authorizations/${newAuthId}/capture `;
    const captureResponse = await axios.post(capture, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(handleResponse(captureResponse));
  }
};

exports.voidPayPalAdAuthorization = async (req, res) => {
  const { authId } = req.body;
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/payments/authorizations/${authId}/void`;
  try {
    const response = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('voidPayPalAdAuthorization => ', response);
    res.json(response.data);
  } catch (err) {
    console.error('Error voiding PayPal ad authorization:', err);
    res.status(500).json({ error: 'Error voiding PayPal ad authorization' });
  }
};

const generateAccessToken = async () => {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString(
    'base64'
  );
  try {
    const response = await axios.post(
      `${base}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const jsonData = await handleResponse(response);
    return jsonData.access_token;
  } catch (err) {
    // Handle any errors from the request
    // console.log('Error generating access token:', err);
    throw new Error('Error generating access token');
  }
};

const handleResponse = (response) => {
  if (response.status === 200 || response.status === 201) {
    return response.data;
  } else {
    console.log('Response status:', response.status);
    throw new Error('Invalid response status');
  }
};

const isAuthorizationWithinHonorPeriod = (createTime) => {
  const honorPeriodDuration = 3 * 24 * 60 * 60 * 1000;
  const currentTimestamp = new Date().getTime();
  const createTimestamp = new Date(createTime).getTime();
  return currentTimestamp - createTimestamp <= honorPeriodDuration;
};
