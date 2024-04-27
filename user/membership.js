const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');
const {sendEmail} = require('./email-sender')
const app = express();
app.use(express.json());

const pool = new Pool({ 
  connectionString: 'postgres://postgres.joazwqbacxxldhfbyziq:HB2Y1HikcgBPVX94@aws-0-us-west-1.pooler.supabase.com:5432/postgres', 
})
const DEFAULT_AFFILIATE_COMMISSION_RATE = 0.1 //sets the future commission rate that will be paid on referrals from a new user

const createUniqueReferralCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let locator = "";
  for (let i = 0; i < 5; i++) {
    locator += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return locator;

}

const getAffiliateByReferralCode= async(referralCode) => {
  const result = await pool.query('select * from affiliate_info where referral_code = $1', [referralCode]);

  if (result.rows.length > 0) {
      //found affiliate! 
      return result.rows[0]
  } else {
      return null
  }
}

const getAffiliateInfoByUserId = async(userId) => {
  const result = await pool.query('select * from affiliate_info where user_id = $1', [userId]);

  if (result.rows.length > 0) {
      //found affiliate! 
      return result.rows[0]
  } else {
      return null
  }

}
async function recordAffiliateClick(referralCode) {
  try {
    const result = await pool.query(
      'UPDATE affiliate_info SET total_clicks = total_clicks + 1 WHERE referral_code = $1',
      [referralCode]
    );

    console.log(`Clicks updated for referral code: ${referralCode}`);
    return result.rowCount > 0; // True if a row was updated
  } catch (error) {
    console.error('Error updating clicks:', error);
    return false;
  }
}

async function recordAffiliateSignup(referralCode) {
  try {
    const result = await pool.query(
      'UPDATE affiliate_info SET total_signups = total_signups + 1 WHERE referral_code = $1',
      [referralCode]
    );

    console.log(`Signups updated for referral code: ${referralCode}`);
    return result.rowCount > 0; // True if a row was updated
  } catch (error) {
    console.error('Error updating signups:', error);
    return false;
  }
}

const getReferralInformationForCustomer=async(customerUserId) => {
  const result = await pool.query("select * from affiliate_referrals where referred_user_id="+customerUserId)
  if (result.rows.length > 0) {
    console.log("user "+customerUserId+" was referred by "+result.rows[0].affiliate_user_id)
    return result.rows[0] //the id of this record represents the unique binding of customer to the affiliate who referred them
    //use it when handling the affiliate_commissions_table - it is the affiliate_referral_id foreign key

  } else {
    return null
  }
}

const grantAffiliateCommissionCreditForSale=async(txid, amount, purchaseDescription, isResidual, affiliateReferralId, affiliateUserId) => {
  amount = parseFloat(amount)
  const commissionPayment = DEFAULT_AFFILIATE_COMMISSION_RATE * amount
  console.log("commission logged. tx details: ",[affiliateReferralId, txid,amount, DEFAULT_AFFILIATE_COMMISSION_RATE, commissionPayment])


  await pool.query (`insert into affiliate_commissions (affiliate_referral_id, transaction_id, transaction_amount, commission_rate, commission_amount) values  (${affiliateReferralId},${txid},${amount.toFixed(2)}, ${DEFAULT_AFFILIATE_COMMISSION_RATE.toFixed(2)}, ${commissionPayment.toFixed(2)})`)

  //now, update the aggregate statistics in the affiliate dashboard
  const affiliateInfo = await getAffiliateInfoByUserId(affiliateUserId)

  const {gross_sales_volume, net_earnings} = affiliateInfo
  let newSalesVolume = parseFloat(gross_sales_volume) + parseFloat(amount)
  let newEarnings = parseFloat(net_earnings) + parseFloat(commissionPayment)
  await pool.query("update affiliate_info set gross_sales_volume=$1, net_earnings=$2 where user_id=$3",
[newSalesVolume, newEarnings, affiliateUserId])

console.log("updated aggregate earnings on affiliate dashboard")

  console.log(`granted commission ${commissionPayment} for sale of ${amount} to affiliate user ${affiliateUserId} (referral ${affiliateReferralId})`)
  return true

}
//signs up a user, credits their referrer, and gives new user a free trial
const createUserWithStandardTrial = async (email, password, referralCode, trialDurationInHours=72) => {
  const issued = new Date(Date.now())
  const exipry = new Date(Date.now() + trialDurationInHours * 60 * 60 * 1000); // Set expiry to 24 hours from now
  await pool.query (`insert into users (email, password, membership_start_date, membership_expiry_date) values ($1, $2, $3, $4) `,
  [email, password, issued, exipry])

  const results = await pool.query(`select * from users where email='${email}'`)
  if (results.rows.length > 0) {
    console.log("Created user: ", JSON.stringify(results.rows[0], null, 2))
    const newUser = results.rows[0]

    if (referralCode && referralCode.length > 0) {
      const referringAffiliate = await getAffiliateByReferralCode(referralCode)
      if (referringAffiliate) {
        await pool.query(`insert into affiliate_referrals (affiliate_user_id, referred_user_id) values ($1, $2)`, 
        [referringAffiliate.user_id, newUser.id])

        console.log(`User ${referringAffiliate.user_id} credited with referral (code ${referralCode})`)
        
      } else {
        console.log("Invalid or missing referral code, no referral credit will be given")
      }
    }

    //create user affiliate info defaults
    const newAffiliateId = createUniqueReferralCode()
    console.log("User has been assigned referral code "+newAffiliateId+" for future use")

    await pool.query("insert into affiliate_info (user_id, referral_code) values ($1, $2)", 
    [newUser.id, newAffiliateId])

    console.log("done!!! the user has been created with matching affiliate_info, and the referring affiliate has been credited")
    
    const userProfile = await getUserProfile(newUser.id)
    return userProfile
  } else {
    return {error: "A user with this email already exists"}
  }


}

//gets a user by id and returns full details along with their affiliate summary
//this response can be used to populate member and affiliate dashboards
const getUserProfile = async (userId) => {
  const userInfo = await pool.query(`select * from users where id=${userId}`)
  const affiliateInfo = await pool.query(`select * from affiliate_info where user_id=${userId}`)

  return {user: userInfo.rows[0], affiliate_info: affiliateInfo.rows[0]}
}

const verifyLogin = async(email, password) => {

  const results = await pool.query(`select * from users where email='${email}' and password='${password}'`)
  if (results.rows.length > 0) {
    const userProfile = await getUserProfile(results.rows[0].id)
    console.log("Successful login for "+email+", returning profile "+userProfile.user.id)
    return userProfile
  }
}

const checkMembershipStatus = async(userId) => {
  const info = await getUserProfile(userId)
  if (info.user.membership_status=="TRIAL" && info.user.membership_expiry_date < new Date(Date.now())) {
    console.log("Membership for user id "+userId+" has expired, updating status")
    
    //lazy expiry check
    await pool.query(
      "UPDATE users SET membership_status = 'EXPIRED' where id = $1",
      [userId]
    );
    
    return {status: "EXPIRED", membership_start_date: info.user.membership_start_date, membership_expiry_date: info.user.membership_expiry_date, membership_renewal_date: null, package: info.user.membership_package}

  } else {
    return info.user

    //return {status: info.user.membership_status, membership_start_date: info.user.membership_start_date, membership_expiry_date: info.user.membership_expiry_date, membership_renewal_date: info.user.membership_renewal_date, package: info.user.membership_package}
  }
}

const upgradeMembershipStatus = async(userId, price, packageDescription, durationInDays, isRecurring) => {
  const issued = new Date(Date.now())
  const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000 * durationInDays)
  if (isRecurring) {
    await pool.query(
      "UPDATE users SET membership_status = 'VALID', membership_start_date=$1, membership_renewal_date=$2,  membership_expiry_date=NULL, membership_package=$3 where id = $4",
      [issued, endDate, packageDescription, userId]
    );
  } else {
    await pool.query(
      "UPDATE users SET membership_status = 'VALID', membership_start_date=$1, membership_expiry_date=$2,  membership_renewal_date=NULL, membership_package=$3 where id = $4",
      [issued, endDate, packageDescription, userId]
    );

  }

  const referringAffiliate = await getReferralInformationForCustomer(userId)
  const fakeTxId = parseInt(Math.random() * 10000000) //need to fix!!!
  if (referringAffiliate != null)
  { 
    console.log("granting affiliate commission for this upgrade...")
    const {id, affiliate_user_id} = referringAffiliate
    await grantAffiliateCommissionCreditForSale(fakeTxId, price, packageDescription, isRecurring, referringAffiliate.id, referringAffiliate.affiliate_user_id)
  }

  console.log("upgrade complete... returning updated member status")
  const status = await checkMembershipStatus(userId)
  return status

}

const httpApi=(app, endpointBase='/api/user') => {
  app.get(endpointBase+'/record_click/:referralId', async(req, res) => {
    const {referralId} = req.params
    const result = await recordAffiliateClick(referralId)
    console.log("affiliate click counter update for promo "+referralId+": "+result)
    res.status(200).json({status: result})
  })
  app.get(endpointBase + '/signup', async (req, res) => {
    try {
      const {email, password, referralCode} = req.query;
      const profile = await createUserWithStandardTrial(email, password, referralCode);
      if (referralCode && referralCode.length > 0) {
        
        const result = await recordAffiliateSignup(referralCode)
        console.log("referral counter update success: "+result)
      }

      //sendEmail('noreply@flixi.org', email, "Welcome to Chatflix!", "Congrats. You've just signed up for the only streaming service you'll ever need. With over 500,000 Movies, TV Series, and more, Chatflix has more content for less money than any other provider.","<p>Congrats. You've just signed up for the only streaming service you'll ever need. With over 500,000 Movies, TV Series, and more, Chatflix has more content for less money than any other provider.</p>" )
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })

  app.get(endpointBase + '/login', async (req, res) => {
    try {
      const {email, password} = req.query;
      const profile = await verifyLogin(email, password);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })

  app.get(endpointBase + '/getUpdatedMemberProfile', async (req, res) => {
    try {
      const {userId} = req.query;

      //this route is not idempotent... the checkMembershipStatus 
      //performs an update to the status if the expiration date is past...
      //if somebody wants to refactor this, go ahead
      const updatedMembershipStatus = await checkMembershipStatus(userId);
      const userProfile = await getUserProfile(userId)

      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })

  app.get(endpointBase + '/addPremiumMembership', async (req, res) => {
    try {
      const {userId, price, packageDescription, durationInDays, isRecurring} = req.query;
      const results = await upgradeMembershipStatus(userId, price, packageDescription, durationInDays, isRecurring)
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })

}
module.exports = {httpApi}
  
