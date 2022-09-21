const User = require('../models/user');
const Cart = require('../models/cart');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const Ad = require('../models/ad');
const Cardinity = require('cardinity-nodejs');

const Client = Cardinity.client();
const Payment = Cardinity.payment();

const client = new Client(
  process.env.CARDINITY_KEY,
  process.env.CARDINITY_SECRET
);

exports.calculateFinalAmount = async (req, res) => {
  const { coupon } = req.body;
  const user = await User.findOne({ email: req.user.email }).exec();
  const { cartTotal, totalAfterDiscount } = await Cart.findOne({
    orderedBy: user._id,
  }).exec();

  let finalAmount = 0;
  if (coupon && totalAfterDiscount) {
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

exports.createPayment = async (req, res) => {
  const { cardHolder, cardNumber, expiry, cvc } = req.body.values;
  const payable = (req.body.payable / 100).toFixed(2).toString();
  const { userAgent } = req.body;

  const purchase = new Payment({
    amount: payable,
    currency: 'eur',
    country: 'CY',
    payment_method: 'card',
    payment_instrument: {
      pan: cardNumber,
      exp_year: parseInt(expiry.slice(-4)),
      exp_month: parseInt(expiry.slice(0, 2)),
      cvc: cvc,
      holder: cardHolder,
    },
    threeds2_data: {
      notification_url: 'https://www.loveisincyprus.com',
      browser_info: {
        accept_header: 'text/html',
        browser_language: 'en',
        screen_width: 390,
        screen_height: 400,
        challenge_window_size: '390x400',
        user_agent: userAgent,
        color_depth: 24,
        time_zone: -60,
      },
    },
  });

  if (purchase.errors) {
    console.log('purchase.errors', purchase.errors);
    res.send(purchase.errors);
  } else {
    client
      .call(purchase)
      .then((response) => {
        if (response.status == 'approved') {
          console.log(response.status);
          res.send(response);
        } else if (response.status == 'pending') {
          // handle 3D secure flow
          console.log('pending', response.status);
          if (response.authorization_information) {
            var form_url = response.authorization_information.url;
            var inputs =
              '<input type="hidden" name="PaReq" value="' +
              response.authorization_information.data +
              '" />' +
              '<input type="hidden" name="TermUrl" value="http://localhost:3000" />';
            var threed_key = 'MD';
          } else if (response.threeds2_data) {
            var form_url = response.threeds2_data.acs_url;
            var inputs =
              '<input name="creq" value="' +
              response.threeds2_data.creq +
              '" />';
            var threed_key = 'threeDSSessionData';
          }
          res.setHeader('Content-Type', 'text/html');
          form =
            '<html><head>' +
            '<title>3-D Secure Example</title>' +
            '<script type="text/javascript">' +
            +'function OnLoadEvent(){' +
            // Make the form post as soon as it has been loaded.
            +'document.ThreeDForm.submit();' +
            +'}' +
            '</script>' +
            '</head>' +
            '<body onload="OnLoadEvent();">' +
            '<form name="ThreeDForm" method="POST" action="' +
            form_url +
            '">' +
            '<button type=submit>Click Here</button>' +
            inputs +
            '<input type="hidden" name="' +
            threed_key +
            '" value="' +
            response.id +
            '" />' +
            '</form>' +
            '</body></html>';
          res.end(form);
        } else {
          res.setHeader('Content-Type', 'text/plain');
          res.end(JSON.stringify(response, null, 2));
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

exports.createAdPayment = async (req, res) => {
  console.log('createAdPayment controller response => ', req.body);
  const { cardHolder, cardNumber, expiry, cvc } = req.body.values;
  const { payable, userAgent, _id } = req.body;

  const purchase = new Payment({
    amount: payable,
    currency: 'eur',
    country: 'CY',
    payment_method: 'card',
    payment_instrument: {
      pan: cardNumber,
      exp_year: parseInt(expiry.slice(-4)),
      exp_month: parseInt(expiry.slice(0, 2)),
      cvc: cvc,
      holder: cardHolder,
    },
    threeds2_data: {
      notification_url: 'https://www.loveisincyprus.com',
      browser_info: {
        accept_header: 'text/html',
        browser_language: 'en',
        screen_width: 390,
        screen_height: 400,
        challenge_window_size: '390x400',
        user_agent: userAgent,
        color_depth: 24,
        time_zone: -60,
      },
    },
  });

  if (purchase.errors) {
    console.log('purchase.errors', purchase.errors);
    res.send(purchase.errors);
  } else {
    client
      .call(purchase)
      .then((response) => {
        if (response.status == 'approved') {
          console.log(response.status);
          res.send(response);
        } else if (response.status == 'pending') {
          // handle 3D secure flow
          console.log('pending', response.status);
          if (response.authorization_information) {
            var form_url = response.authorization_information.url;
            var inputs =
              '<input type="hidden" name="PaReq" value="' +
              response.authorization_information.data +
              '" />' +
              '<input type="hidden" name="TermUrl" value="http://localhost:3000" />';
            var threed_key = 'MD';
          } else if (response.threeds2_data) {
            var form_url = response.threeds2_data.acs_url;
            var inputs =
              '<input name="creq" value="' +
              response.threeds2_data.creq +
              '" />';
            var threed_key = 'threeDSSessionData';
          }
          res.setHeader('Content-Type', 'text/html');
          form =
            '<html><head>' +
            '<title>3-D Secure Example</title>' +
            '<script type="text/javascript">' +
            +'function OnLoadEvent(){' +
            // Make the form post as soon as it has been loaded.
            +'document.ThreeDForm.submit();' +
            +'}' +
            '</script>' +
            '</head>' +
            '<body onload="OnLoadEvent();">' +
            '<form name="ThreeDForm" method="POST" action="' +
            form_url +
            '">' +
            '<button type=submit>Click Here</button>' +
            inputs +
            '<input type="hidden" name="' +
            threed_key +
            '" value="' +
            response.id +
            '" />' +
            '</form>' +
            '</body></html>';
          res.end(form);
        } else {
          res.setHeader('Content-Type', 'text/plain');
          res.end(JSON.stringify(response, null, 2));
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
  const paid = await Ad.findByIdAndUpdate(
    _id,
    { status: 'paid' },
    { new: true }
  ).exec();
};

exports.createMembershipPayment = async (req, res) => {
  const { cardHolder, cardNumber, expiry, cvc } = req.body.values;
  const { payable, userAgent, user } = req.body;

  const purchase = new Payment({
    amount: payable,
    currency: 'eur',
    country: 'CY',
    payment_method: 'card',
    payment_instrument: {
      pan: cardNumber,
      exp_year: parseInt(expiry.slice(-4)),
      exp_month: parseInt(expiry.slice(0, 2)),
      cvc: cvc,
      holder: cardHolder,
    },
    threeds2_data: {
      notification_url: 'https://www.loveisincyprus.com',
      browser_info: {
        accept_header: 'text/html',
        browser_language: 'en',
        screen_width: 390,
        screen_height: 400,
        challenge_window_size: '390x400',
        user_agent: userAgent,
        color_depth: 24,
        time_zone: -60,
      },
    },
  });

  if (purchase.errors) {
    console.log('purchase.errors', purchase.errors);
    res.send(purchase.errors);
  } else {
    client
      .call(purchase)
      .then((response) => {
        if (response.status == 'approved') {
          updateMembership(payable, user);
          console.log(response.status);
          res.send(response);
        } else if (response.status == 'pending') {
          // handle 3D secure flow
          console.log('pending', response.status);
          if (response.authorization_information) {
            var form_url = response.authorization_information.url;
            var inputs =
              '<input type="hidden" name="PaReq" value="' +
              response.authorization_information.data +
              '" />' +
              '<input type="hidden" name="TermUrl" value="http://localhost:3000" />';
            var threed_key = 'MD';
          } else if (response.threeds2_data) {
            var form_url = response.threeds2_data.acs_url;
            var inputs =
              '<input name="creq" value="' +
              response.threeds2_data.creq +
              '" />';
            var threed_key = 'threeDSSessionData';
          }
          res.setHeader('Content-Type', 'text/html');
          form =
            '<html><head>' +
            '<title>3-D Secure Example</title>' +
            '<script type="text/javascript">' +
            +'function OnLoadEvent(){' +
            // Make the form post as soon as it has been loaded.
            +'document.ThreeDForm.submit();' +
            +'}' +
            '</script>' +
            '</head>' +
            '<body onload="OnLoadEvent();">' +
            '<form name="ThreeDForm" method="POST" action="' +
            form_url +
            '">' +
            '<button type=submit>Click Here</button>' +
            inputs +
            '<input type="hidden" name="' +
            threed_key +
            '" value="' +
            response.id +
            '" />' +
            '</form>' +
            '</body></html>';
          res.end(form);
        } else {
          res.setHeader('Content-Type', 'text/plain');
          res.end(JSON.stringify(response, null, 2));
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const updateMembership = async (payable, user, res) => {
  console.log('payable => ', payable);
  console.log('user => ', user);

  if (payable === '10.00') {
    const amendMembership = await User.findByIdAndUpdate(
      { _id: user._id },
      {
        'membership.paid': true,
        'membership.expiry': new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
      { new: true }
    ).exec();
    res.json(amendMembership);
  }
  if (payable === '50.00') {
    const amendMembership = await User.findByIdAndUpdate(
      { _id: user._id },
      {
        'membership.paid': true,
        'membership.expiry': new Date(Date.now() + 180 * 24 * 3600 * 1000),
      },
      { new: true }
    ).exec();
    res.json(amendMembership);
  }
  if (payable === '90.00') {
    const amendMembership = await User.findByIdAndUpdate(
      { _id: user._id },
      {
        'membership.paid': true,
        'membership.expiry': new Date(Date.now() + 365 * 24 * 3600 * 1000),
      },
      { new: true }
    ).exec();
    res.json(amendMembership);
  }
};
