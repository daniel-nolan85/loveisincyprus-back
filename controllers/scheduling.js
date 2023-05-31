const User = require('../models/user');
const mailchimp = require('@mailchimp/mailchimp_marketing');
const moment = require('moment');

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_KEY,
  server: 'us4',
});

exports.deleteOldLists = async (req, res) => {
  try {
    const currentDate = new Date();
    const daysThreshold = 8;
    const listsToDelete = [];

    const getLists = async () => {
      const response = await mailchimp.lists.getAllLists();
      return response.lists;
    };

    const getDaysSinceDate = (date) => {
      const timeDiff = Math.abs(currentDate.getTime() - date.getTime());
      return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    };

    const checkListForDeletion = async (list) => {
      const campaignsResponse = await mailchimp.campaigns.list({
        list_id: list.id,
        count: 1,
        sort_field: 'send_time',
        sort_dir: 'DESC',
      });

      if (campaignsResponse.campaigns.length === 0) {
        const listCreatedDate = new Date(list.date_created);
        const daysSinceCreation = getDaysSinceDate(listCreatedDate);

        if (daysSinceCreation > daysThreshold) {
          listsToDelete.push(list);
        }
      } else {
        const lastCampaignDate = new Date(
          campaignsResponse.campaigns[0].send_time
        );
        const daysSinceLastCampaign = getDaysSinceDate(lastCampaignDate);

        if (daysSinceLastCampaign > daysThreshold) {
          listsToDelete.push(list);
        }
      }
    };

    const deleteLists = async () => {
      const allLists = await getLists();

      for (const list of allLists) {
        await checkListForDeletion(list);
      }

      for (const listToDelete of listsToDelete) {
        await mailchimp.lists.deleteList(listToDelete.id);
      }
    };

    deleteLists();
  } catch (err) {
    console.log(err);
  }
};

exports.emailUpcomingExpiries = async (req, res) => {
  try {
    const timestamp = new Date().getTime();
    const currentDate = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(currentDate.getDate() + 7);
    const users = await User.find({
      'membership.expiry': {
        $gte: currentDate,
        $lte: sevenDaysFromNow,
      },
    }).select('email membership');

    const createAndPopulateList = async () => {
      const newListResponse = await mailchimp.lists.createList({
        name: `Expiry reminder - ${timestamp}`,
        contact: {
          company: 'Aquilion Limited',
          address1: 'Carewatch Barnet, Apex House',
          city: 'Grand Arcade',
          state: 'London',
          zip: 'N12 0EH',
          country: 'United Kingdom',
        },
        permission_reminder:
          'You are receiving this email as a valued member on www.loveisincyprus.com',
        email_type_option: true,
        campaign_defaults: {
          from_name: 'Love Is In Cyprus',
          from_email: 'customercare@loveisincyprus.com',
          subject: 'Love is in Cyprus subscription nearing expiry',
          language: 'en',
        },
      });

      const newListId = newListResponse.id;

      try {
        const addMerge = await mailchimp.lists.addListMergeField(newListId, {
          name: 'EXPIRY_DATE',
          type: 'date',
          options: {
            date_format: 'dddd, Do MMMM YYYY',
          },
        });
        console.log('addMerge => ', addMerge);
      } catch (error) {
        console.error('Error adding merge field:', error);
      }

      for (const user of users) {
        try {
          const expiryDate = moment(user.membership.expiry).format(
            'dddd, Do MMMM YYYY'
          );
          await mailchimp.lists.addListMember(newListId, {
            email_address: user.email,
            status: 'subscribed',
            merge_fields: {
              MMERGE5: expiryDate,
            },
          });
        } catch (error) {
          console.error('Error adding list member:', error);
        }
      }
      await createCampaign(newListId);
    };

    const createCampaign = async (newListId) => {
      const campaign = await mailchimp.campaigns.create({
        type: 'regular',
        recipients: {
          list_id: newListId,
        },
        settings: {
          subject_line: 'Love is in Cyprus subscription nearing expiry',
          from_name: 'Love Is In Cyprus',
          reply_to: 'customercare@loveisincyprus.com',
          from_email: 'customercare@loveisincyprus.com',
        },
      });

      const campaignContent = await mailchimp.campaigns.setContent(
        campaign.id,
        {
          html: `
        <div style="text-align: center">
        <img src="https://res.cloudinary.com/dg9blonbn/image/upload/v1684603773/logo_qinzhi.png" alt="logo" style="width: 100px; height: 100px; margin: 20px 0;">
        </div>
        <p>Dear Valued Member</p>
        <p>We are sending you a friendly reminder to let you know that your current subscription will be coming to an end on *|MMERGE5|*.</p>
        <p>If you would like to renew your subscription now please log into your account, click on your avatar at the top right of the screen and select "Renew Membership" from the dropdown menu.</p>
        <p>If you choose not to renew, you can still enjoy full access to www.loveisincyprus.com until *|MMERGE5|*. After this date your paid membership priveleges will be revoked.</p>
        <p>Thanks for being a valued member of our community.</p>
        `,
        }
      );

      const sendCampaign = await mailchimp.campaigns.send(campaign.id);
      console.log('campaign => ', campaign);
    };

    if (users.length > 0) {
      createAndPopulateList();
    }
  } catch (err) {
    console.log(err);
  }
};
