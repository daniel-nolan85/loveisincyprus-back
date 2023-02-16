const User = require('../models/user');
const Cart = require('../models/cart');
const Ad = require('../models/ad');
const Cardinity = require('cardinity-nodejs');
const nodemailer = require('nodemailer');
const moment = require('moment');

const Client = Cardinity.client();
const Payment = Cardinity.payment();
const Refund = Cardinity.refund();

const client = new Client(
  process.env.CARDINITY_KEY,
  process.env.CARDINITY_SECRET
);

exports.calculateFinalAmount = async (req, res) => {
  const { coupon } = req.body;
  const user = await User.findOne({ mobile: req.user.phone_number })
    .select('_id')
    .exec();
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
    res.send(purchase.errors);
  } else {
    client
      .call(purchase)
      .then((response) => {
        if (response.status == 'approved') {
          res.send(response);
        } else if (response.status == 'pending') {
          if (response.authorization_information) {
            var form_url = response.authorization_information.url;
            var inputs =
              '<input type="hidden" name="PaReq" value="' +
              response.authorization_information.data +
              '" />' +
              '<input type="hidden" name="TermUrl" value="https://loveisincyprus.com" />';
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

exports.createAdPayment = async (req, res) => {
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
    res.send(purchase.errors);
  } else {
    client
      .call(purchase)
      .then((response) => {
        if (response.status == 'approved') {
          res.send(response);
        } else if (response.status == 'pending') {
          if (response.authorization_information) {
            var form_url = response.authorization_information.url;
            var inputs =
              '<input type="hidden" name="PaReq" value="' +
              response.authorization_information.data +
              '" />' +
              '<input type="hidden" name="TermUrl" value="https://loveisincyprus.com" />';
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
          }).select('membership bankDetails email');
          if (existingBank) {
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
            )
              .select('membership bankDetails email')
              .exec();
            res.json({ amendMembership, response });
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
            )
              .select('membership bankDetails email')
              .exec();
            res.json({ amendMembership, response });
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
          }
        } else if (response.status == 'pending') {
          if (response.authorization_information) {
            var form_url = response.authorization_information.url;
            var inputs =
              '<input type="hidden" name="PaReq" value="' +
              response.authorization_information.data +
              '" />' +
              '<input type="hidden" name="TermUrl" value="https://loveisincyprus.com" />';
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
      )
        .select('membership')
        .exec();
      res.json(cancelSubscription);
    })
    .catch((err) => {
      console.log(err);
    });
};
