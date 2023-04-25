const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, text: true, required: true },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
      text: true,
    },
    username: {
      type: String,
      unique: true,
      text: true,
    },
    mobile: { type: String, unique: true, required: true },
    secondMobile: { type: String },
    statement: String,
    answer: String,
    role: {
      type: String,
      default: 'subscriber',
    },
    about: {},
    profileImage: {
      url: String,
      public_id: String,
    },
    coverImage: {
      url: String,
      public_id: String,
    },
    gender: String,
    location: String,
    genderWanted: String,
    relWanted: String,
    birthday: Date,
    age: Number,
    following: [{ type: ObjectId, ref: 'User' }],
    followers: [{ type: ObjectId, ref: 'User' }],
    matches: [{ type: ObjectId, ref: 'User' }],
    nopes: [{ type: ObjectId, ref: 'User' }],
    visitors: [{ type: ObjectId, ref: 'User' }],
    profilePhotos: Array,
    coverPhotos: Array,
    uploadedPhotos: Array,
    cart: {
      type: Array,
      default: [],
    },
    address: [{ type: Object }],
    wishlist: [{ type: ObjectId, ref: 'Product' }],
    pointsGained: [
      {
        amount: Number,
        reason: String,
        awarded: { type: Date, default: Date.now },
      },
    ],
    pointsLost: [
      {
        amount: Number,
        reason: String,
        removed: { type: Date, default: Date.now },
      },
    ],
    pointsSpent: [
      {
        amount: Number,
        reason: String,
        spent: { type: Date, default: Date.now },
      },
    ],
    pointsTotal: Number,
    notifications: [
      {
        notif: {},
        action: String,
        occurred: { type: Date, default: Date.now },
        new: { type: Boolean, default: true },
      },
    ],
    featuredMember: {
      type: Boolean,
      default: false,
    },
    events: [
      {
        name: String,
        location: Object,
        when: Date,
        notes: String,
        invitees: [],
        cancelled: Boolean,
        going: String,
        expired: { type: Boolean, default: false },
      },
    ],
    language: String,
    maritalStatus: String,
    numOfChildren: Number,
    drinks: String,
    smokes: String,
    nationality: String,
    height: String,
    build: String,
    hairColor: String,
    hairStyle: String,
    hairLength: String,
    eyeColor: String,
    ethnicity: String,
    feetType: String,
    loves: [{ type: String, trim: true, lowercase: true }],
    hates: [{ type: String, trim: true, lowercase: true }],
    education: String,
    occupation: { type: String, trim: true, lowercase: true },
    politics: String,
    religion: String,
    pets: [{ type: String, trim: true, lowercase: true }],
    interests: [{ type: String, trim: true, lowercase: true }],
    music: [{ type: String, trim: true, lowercase: true }],
    foods: String,
    books: [{ type: String, trim: true, lowercase: true }],
    films: [{ type: String, trim: true, lowercase: true }],
    sports: [{ type: String, trim: true, lowercase: true }],
    livesWith: String,
    roleInLife: String,
    managesEdu: String,
    hobbies: [{ type: String, trim: true, lowercase: true }],
    marriage: String,
    income: Number,
    ageOfPartner: String,
    traits: [{ type: String, trim: true, lowercase: true }],
    changes: String,
    relocate: String,
    treatSelf: [{ type: String, trim: true, lowercase: true }],
    sexLikes: String,
    sexFrequency: String,
    profileComplete: {
      type: Boolean,
      default: false,
    },
    profilePercentage: Number,
    eventsEligible: {
      type: Boolean,
      default: false,
    },
    optIn: {
      type: Boolean,
      default: true,
    },
    verified: {
      type: String,
      default: 'false',
    },
    messages: [{ sender: String }],
    newNotifs: [{ action: String, id: String }],
    membership: {
      paid: { type: Boolean, default: false },
      startDate: { type: Date },
      expiry: { type: Date },
      trialPeriod: Boolean,
      cardinityId: String,
      cost: String,
    },
    bankDetails: [
      {
        cardHolder: String,
        cardNumber: String,
        expiry: String,
        cvc: String,
        cardBrand: String,
      },
    ],
    clearPhoto: {
      type: Boolean,
      default: false,
    },
    lastLogin: { type: Date },
    userStatus: {
      suspended: { type: Boolean, default: false },
      until: Date,
      reason: String,
    },
    ipAddresses: Array,
    reports: {
      post: Array,
      comment: Array,
      message: Array,
    },
    reported: {
      post: Array,
      comment: Array,
      message: Array,
    },
    messagesSent: [
      {
        content: { type: String, trim: true },
        image: {
          url: String,
          public_id: String,
        },
        receiver: { type: ObjectId, ref: 'User' },
      },
    ],
    messagesReceived: [
      {
        content: { type: String, trim: true },
        image: {
          url: String,
          public_id: String,
        },
        sender: { type: ObjectId, ref: 'User' },
      },
    ],
    itemsOrdered: Number,
    itemsOrderedValue: Number,
    giftCardsSent: Number,
    giftCardsSentValue: Number,
    giftCardsReceived: Number,
    giftCardsReceivedValue: Number,
    tShirts: Number,
    sprays: Number,
    droppers: Number,
    perfumes: Number,
    canVerify: {
      type: Boolean,
      default: false,
    },
    canReported: {
      type: Boolean,
      default: false,
    },
    canPosts: {
      type: Boolean,
      default: false,
    },
    canUsers: {
      type: Boolean,
      default: false,
    },
    canMassMail: {
      type: Boolean,
      default: false,
    },
    canEvents: {
      type: Boolean,
      default: false,
    },
    canOrders: {
      type: Boolean,
      default: false,
    },
    canProducts: {
      type: Boolean,
      default: false,
    },
    canCategories: {
      type: Boolean,
      default: false,
    },
    canSubs: {
      type: Boolean,
      default: false,
    },
    canCoupon: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
