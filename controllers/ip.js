const Ip = require('../models/ip');

exports.fetchIps = async (req, res) => {
  res.json(await Ip.find({}).exec());
};

exports.removeIp = async (req, res) => {
  try {
    res.json(await Ip.findByIdAndDelete(req.params.ipId).exec());
  } catch (err) {
    console.log(err);
  }
};

exports.banIp = async (req, res) => {
  const { ip, city, country, postal, region, timezone } = req.body.ip;

  try {
    res.json(
      await new Ip({
        ip,
        city,
        country,
        postal,
        region,
        timezone,
      }).save()
    );
  } catch (err) {
    console.log(err);
    res.status(400).send('Ban IP failed');
  }
};
