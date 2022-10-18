const User = require('../models/user');
const Cart = require('../models/cart');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const Ad = require('../models/ad');
const Cardinity = require('cardinity-nodejs');

const Client = Cardinity.client();
const Payment = Cardinity.payment();
const Refund = Cardinity.refund();

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
  const deliveryFee = parseFloat(req.body.deliveryFee.toFixed(2));
  const payable = parseFloat((req.body.payable / 100).toFixed(2));
  const amount = (payable + deliveryFee).toFixed(2).toString();
  const { userAgent } = req.body;
  console.log('deliveryFee => ', deliveryFee);
  console.log('payable => ', payable);
  console.log('amount => ', amount);

  const purchase = new Payment({
    amount,
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
      .then(async (response) => {
        if (response.status == 'approved') {
          let days = 0;
          if (payable === '10.00') {
            days = 30;
          } else if (payable === '50.00') {
            days = 180;
          } else {
            days = 365;
          }
          const existingBank = await User.findOne({
            _id: user._id,
            'bankDetails.cardHolder': cardHolder,
            'bankDetails.cardNumber': cardNumber,
            'bankDetails.expiry': expiry,
            'bankDetails.cvc': cvc,
          });
          if (existingBank) {
            // return res.json(existingBank);
            const amendMembership = await User.findByIdAndUpdate(
              { _id: user._id },
              {
                'membership.paid': true,
                'membership.trialPeriod': true,
                'membership.startDate': new Date(Date.now()),
                'membership.expiry': new Date(
                  Date.now() + days * 24 * 3600 * 1000
                ),
                'membership.cardinityId': response.id,
                'membership.cost': payable,
              },
              { new: true }
            ).exec();
            res.json({ amendMembership, response });
          } else {
            const amendMembership = await User.findByIdAndUpdate(
              { _id: user._id },
              {
                'membership.paid': true,
                'membership.trialPeriod': true,
                'membership.startDate': new Date(Date.now()),
                'membership.expiry': new Date(
                  Date.now() + days * 24 * 3600 * 1000
                ),
                'membership.cardinityId': response.id,
                'membership.cost': payable,
                $addToSet: {
                  bankDetails: {
                    cardHolder,
                    cardNumber,
                    expiry,
                    cvc,
                    cardBrand: response.payment_instrument.card_brand,
                  },
                },
              },
              { new: true }
            ).exec();
            res.json({ amendMembership, response });
          }
        } else if (response.status == 'pending') {
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

exports.refundSubscription = async (req, res) => {
  console.log('refundSubscription => ', req.body);
  const refund = new Refund({
    amount: req.body.user.membership.cost,
    description:
      'User has decided to cancel their subscription within their trial period',
    id: req.body.user.membership.cardinityId,
  });

  client
    .call(refund)
    .then(async (response) => {
      const cancelSubscription = await User.findByIdAndUpdate(
        {
          _id: req.body.user._id,
        },
        {
          'membership.paid': false,
          'membership.trialPeriod': false,
        },
        { new: true }
      ).exec();
      res.json(cancelSubscription);
    })
    .catch((err) => {
      console.log(err);
    });
};
