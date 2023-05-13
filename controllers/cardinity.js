const User = require('../models/user');
const Cart = require('../models/cart');
const Ad = require('../models/ad');
const Cardinity = require('cardinity-nodejs');
const nodemailer = require('nodemailer');
const moment = require('moment');

const Client = Cardinity.client();
const Payment = Cardinity.payment();
const Refund = Cardinity.refund();
const Finalize = Cardinity.finalize();

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
      notification_url: `${process.env.NOTIFICATION_URL}/api/cardinity/3d/callback`,
      browser_info: {
        accept_header: 'application/json',
        browser_language: 'en-US',
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
        res.send(response);
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
      notification_url: `${process.env.NOTIFICATION_URL}/api/cardinity/ad/3d/callback`,
      browser_info: {
        accept_header: 'application/json',
        browser_language: 'en-US',
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
        res.send(response);
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

exports.createGCPayment = async (req, res) => {
  const { cardHolder, cardNumber, expiry, cvc } = req.body.values;
  const { amount, userAgent } = req.body;

  const purchase = new Payment({
    amount: amount,
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
      notification_url: `${process.env.NOTIFICATION_URL}/api/cardinity/gc/3d/callback`,
      browser_info: {
        accept_header: 'application/json',
        browser_language: 'en-US',
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
        res.send(response);
      })
      .catch((err) => {
        console.log(err);
      });
  }
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
      notification_url: `${process.env.NOTIFICATION_URL}/api/cardinity/membership/3d/callback/${user._id}?cardHolder=${cardHolder}&cardNumber=${cardNumber}&expiry=${expiry}&cvc=${cvc}`,
      browser_info: {
        accept_header: 'text/html',
        browser_language: 'en-US',
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
        } else {
          res.send(response);
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

exports.handlePending = async (req, res) => {
  console.log('handlePending => ', req.body);
  let finalize_obj = null;
  if (req.body.PaRes) {
    finalize_obj = new Finalize({
      id: req.body.MD,
      authorize_data: req.body.PaRes,
    });
  } else if (req.body.cres) {
    console.log('cres');
    finalize_obj = new Finalize({
      id: req.body.threeDSSessionData,
      cres: req.body.cres,
      threedsv2: true,
    });
    console.log('finalize_obj => ', finalize_obj);
  }
  if (!finalize_obj) {
    console.log('!finalize_obj');
    res.end('Invalid request');
    return;
  }

  client
    .call(finalize_obj)
    .then(function (response) {
      if (response.status == 'approved') {
        res.redirect(
          `${
            process.env.REDIRECT
          }/finalizing-payment?status=approved&response=${encodeURIComponent(
            JSON.stringify(response)
          )}`
        );
      }
    })
    .catch(function (error) {
      console.log(error);
      res.end(JSON.stringify(error, null, 2));
    });
};

exports.handleAdPending = async (req, res) => {
  console.log('handleAdPending => ', req.body);
  let finalize_obj = null;
  if (req.body.PaRes) {
    finalize_obj = new Finalize({
      id: req.body.MD,
      authorize_data: req.body.PaRes,
    });
  } else if (req.body.cres) {
    console.log('cres');
    finalize_obj = new Finalize({
      id: req.body.threeDSSessionData,
      cres: req.body.cres,
      threedsv2: true,
    });
    console.log('finalize_obj => ', finalize_obj);
  }
  if (!finalize_obj) {
    console.log('!finalize_obj');
    res.end('Invalid request');
    return;
  }

  client
    .call(finalize_obj)
    .then(function (response) {
      if (response.status == 'approved') {
        res.redirect(
          `${
            process.env.REDIRECT
          }/finalizing-ad-payment?status=approved&response=${encodeURIComponent(
            JSON.stringify(response)
          )}`
        );
      }
    })
    .catch(function (error) {
      console.log(error);
      res.end(JSON.stringify(error, null, 2));
    });
};

exports.handleGCPending = async (req, res) => {
  console.log('handlePending => ', req.body);
  let finalize_obj = null;
  if (req.body.PaRes) {
    finalize_obj = new Finalize({
      id: req.body.MD,
      authorize_data: req.body.PaRes,
    });
  } else if (req.body.cres) {
    console.log('cres');
    finalize_obj = new Finalize({
      id: req.body.threeDSSessionData,
      cres: req.body.cres,
      threedsv2: true,
    });
    console.log('finalize_obj => ', finalize_obj);
  }
  if (!finalize_obj) {
    console.log('!finalize_obj');
    res.end('Invalid request');
    return;
  }

  client
    .call(finalize_obj)
    .then(function (response) {
      if (response.status == 'approved') {
        res.redirect(
          `${
            process.env.REDIRECT
          }/finalizing-gc-payment?status=approved&response=${encodeURIComponent(
            JSON.stringify(response)
          )}`
        );
      }
    })
    .catch(function (error) {
      console.log(error);
      res.end(JSON.stringify(error, null, 2));
    });
};

exports.handleMembershipPending = async (req, res) => {
  const { userId } = req.params;
  const { cardHolder, cardNumber, expiry, cvc } = req.query;

  let finalize_obj = null;
  if (req.body.PaRes) {
    console.log('PaRes');
    finalize_obj = new Finalize({
      id: req.body.MD,
      authorize_data: req.body.PaRes,
    });
    console.log('finalize_obj => ', finalize_obj);
  } else if (req.body.cres) {
    console.log('cres');
    finalize_obj = new Finalize({
      id: req.body.threeDSSessionData,
      cres: req.body.cres,
      threedsv2: true,
    });
    console.log('finalize_obj => ', finalize_obj);
  }
  if (!finalize_obj) {
    console.log('!finalize_obj');
    res.end('Invalid request');
    return;
  }

  client
    .call(finalize_obj)
    .then(async (response) => {
      if (response.status == 'approved') {
        const { amount } = response;
        console.log('response => ', response);
        let days = 0;
        if (amount === '10.00') {
          days = 30;
        } else if (amount === '50.00') {
          days = 180;
        } else {
          days = 365;
        }
        const existingBank = await User.findOne({
          _id: userId,
          'bankDetails.cardHolder': cardHolder,
          'bankDetails.cardNumber': cardNumber,
          'bankDetails.expiry': expiry,
          'bankDetails.cvc': cvc,
        }).select('membership bankDetails email');
        if (existingBank) {
          const amendMembership = await User.findByIdAndUpdate(
            { _id: userId },
            {
              'membership.paid': true,
              'membership.trialPeriod': true,
              'membership.startDate': new Date(Date.now()),
              'membership.expiry': new Date(
                Date.now() + days * 24 * 3600 * 1000
              ),
              'membership.cardinityId': response.id,
              'membership.cost': amount,
            },
            { new: true }
          )
            .select('membership bankDetails email')
            .exec();
          res.redirect(
            `${
              process.env.REDIRECT
            }/finalizing-membership-payment?status=approved&response=${encodeURIComponent(
              JSON.stringify(response)
            )}&amendMembership=${encodeURIComponent(
              JSON.stringify(amendMembership)
            )}`
          );
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
            { _id: userId },
            {
              'membership.paid': true,
              'membership.trialPeriod': true,
              'membership.startDate': new Date(Date.now()),
              'membership.expiry': new Date(
                Date.now() + days * 24 * 3600 * 1000
              ),
              'membership.cardinityId': response.id,
              'membership.cost': amount,
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
          res.redirect(
            `${
              process.env.REDIRECT
            }/finalizing-membership-payment?status=approved&response=${encodeURIComponent(
              JSON.stringify(response)
            )}&amendMembership=${encodeURIComponent(
              JSON.stringify(amendMembership)
            )}`
          );
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
      }
    })
    .catch(function (error) {
      console.log(error);
      res.end(JSON.stringify(error, null, 2));
    });
};
