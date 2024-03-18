const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
app.use(express.json());

/* 
We're dealing with this schema. A product is a fixed length subscription to a website, and depending which one you buy, 
you get a certain number of device activations - this is called a "membership" - and we generate one membership code for each device, that 
grants it access to the product for the duration of the subscription. so if you buy a 30 day membership, you get 4 codes, 
to be used on 4 different devices for the duration of the subscription. We did it this way because password sharing is 
impossible to properly police, and because we want to give users autonomy and privacy - if joe flixy buys a 30 day pack for $10
and sells the 4 codes for $5 each to 4 different people, more power to him.

CREATE TABLE membership_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  issued TIMESTAMP NOT NULL,
  expiry TIMESTAMP NOT NULL,
  has_been_used BOOLEAN DEFAULT FALSE,
  is_free_trial BOOLEAN DEFAULT FALSE,
  transaction_id VARCHAR(255),
  notes TEXT
);


CREATE TABLE transactions (
	id SERIAL PRIMARY KEY,
	product_id int not null,
	transaction_date timestamp default NOW(),
	amount_usd decimal not null,
	payment_provider varchar(255),
	payment_id varchar(255),
	is_crypto boolean default false,
	is_free boolean default false,
	notes TEXT
);

CREATE TABLE products (
	id serial primary key,
	product_name varchar(255),
	description varchar(255),
	price decimal,
	membership_duration int,
	max_activations int
);
*/



//AWS database c / o supabase, NOT FOR PRODUCTION
const pool = new Pool({ 
  connectionString: 'postgres://postgres.joazwqbacxxldhfbyziq:HB2Y1HikcgBPVX94@aws-0-us-west-1.pooler.supabase.com:5432/postgres', 
})

//when a user applies a code to a device, we capture this information in case we need to manually reactivate a code
//it will prevent 95% of fraud, and the other 5% we don't care about
const getDeviceInfoForActivation = (req) => {
  const clientIp = req.ip || req.connection.remoteAddress;

  // Headers that may indicate proxy status and user IP
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];

  // Origin URL
  const originUrl = req.get('origin') || req.get('referer');

  // User-Agent string
  const userAgent = req.get('User-Agent');

  // Constructing the JSON object to return
  const clientInfo = {
      clientIp,
      forwardedFor,
      realIp,
      originUrl,
      userAgent
  };

  return clientInfo
}

// Generate a unique code
function generateCode() {
  return crypto.randomBytes(8).toString('hex');
}

// Encrypt the code and expiry date
function encryptCode(code, expiry) {
  const data = `${code}|${expiry.toISOString()}`;
  return Buffer.from(data).toString('base64');
}

// Decrypt the encrypted code
function decryptCode(encryptedCode) {
  const data = Buffer.from(encryptedCode, 'base64').toString('utf8');
  const [code, expiry] = data.split('|');
  return { code, expiry: new Date(expiry) };
}


// Check if a code is valid (not expired and not used)
async function isCodeValid(code) {
  const result = await pool.query(
    'SELECT * FROM membership_codes WHERE code = $1 AND expiry > NOW() AND activation_count < max_device_activations',
    [code]
  );
  return result.rows.length > 0;
}

const getCodeInfo = async(encryptedCode) => {
  const {code, expiry} = decryptCode(encryptedCode);
  const existingCodes= await pool.query('select * from membership_codes where code = $1', [code]);

    if (existingCodes.rows.length > 0) {
      //codes already issued
      const {issued, is_free_trial, activation_count, max_device_activations}= existingCodes.rows[0]


      return { code: encryptedCode, expiry: expiry, issued: issued, isFreeTrial: is_free_trial, activationCount: activation_count, maxDeviceActivations: max_device_activations }

    } else {
      return null
    }

}

// Generate and save a new code
//app.post('/api/codes', async (req, res) => {
const createDeviceActivationCode = async(transactionId, durationInDays, isFreeTrial, maxDeviceActivations) => {
  const code = generateCode();
  const expiry = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000); // Set expiry to 24 hours from now
  const issued = new Date(Date.now())
  try {
    await pool.query(
      'INSERT INTO membership_codes (code, issued, expiry, transaction_id, is_free_trial, max_device_activations) VALUES ($1, $2, $3, $4, $5, $6)',
      [code, issued, expiry, transactionId, isFreeTrial, maxDeviceActivations]
    );

    const encryptedCode = encryptCode(code, expiry);
    return { code: encryptedCode, expiry: expiry, issued: issued, isFreeTrial: isFreeTrial, activationCount: 0, maxDeviceActivations: maxDeviceActivations }

  } catch (error) {
    console.error('Error creating code:', error);
    return null
  }
};

//This is the entry point for when the user inputs an (encrypted) code into the front end
//It decrypts the package,checks if the code is valid (not expired and not used), and returns status, expiry, and transaction info
//It also marks the code as used so that it can't be used again. This operation is therefore not idempotent
//There's a known issue here, where if the code validates properly, gets marked as used, but then the client 
//crashes or otherwise fails to properly store the code, the code will still be marked as used.
//
//We should probably update this to be idempotent, but it's not urgent right now - customer service can give benefit of the doubt
//Let's make some money!  
const validateAndApplyCode = async(encryptedCode, userHttpRequest) =>{  
  //const { code: encryptedCode } = req.body;
  const deviceInfo = userHttpRequest ? getDeviceInfoForActivation(userHttpRequest)
                      : {clientIp: 'unknown', forwardedFor: 'unknown', realIp: 'unknown', originUrl: 'unknown', userAgent: 'unknown'}

  try {
    const { code, expiry } = decryptCode(encryptedCode);
    const isValid = await isCodeValid(code);

    if (isValid) {
      const activationContext = JSON.stringify({
        deviceInfo, 
        appliedOnDate: Date.now()
      })

      await pool.query(
        'UPDATE membership_codes SET activation_count = activation_count + 1, notes=$1 WHERE code = $2',
        [activationContext, code]
      );

      const codeInfo = await getCodeInfo(encryptedCode);

      return  codeInfo
    } else {
      throw new Error("Invalid code! Go fuck off and try again later.");
    }
  } catch (error) {
    throw error //some other error
  }
};

//given a transaction id, looks up the associated product, and generates the correct number 
//of codes for the duration of the subscription that was purchased. 
//if codes have already been issued, just returns the already issued codes and notes whether they've been used or not
const issueMembershipCodesForOrder = async(transactionId) => {
  try {
    const existingCodes= await pool.query('select * from membership_codes where transaction_id = $1', [transactionId]);

    if (existingCodes.rows.length > 0) {
      //codes already issued
      throw new Error('Codes already issued');
    } else {
      const tx = await pool.query('select * from transactions where id = $1', [transactionId]);
      if (tx.rows.length === 0) {
        throw new Error('Invalid transaction ID');
      }

      const product = await pool.query('select * from products where id = $1', [tx.rows[0].product_id]);
      if (product.rows.length === 0) {
        throw new Error('Invalid product ID');
      }
      const {membership_duration, max_activations, price} = product.rows[0];
      const isFreeTrial = product.rows[0].price <= 0;
      const code = await createDeviceActivationCode(transactionId, membership_duration, isFreeTrial, max_activations);
      return code

    }
  }

  catch (error) {
    console.error('Error issuing membership codes:', error);
    throw error;
  }
};

const getAllProducts= async(includeFreeTrialProducts) => {
  try {
    const products = await pool.query('select * from products order by membership_duration desc');
    if (includeFreeTrialProducts) {
      return products.rows
    } else {
      return products.rows.filter(product => product.price > 0)
    }
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

const createTransaction = async(product_id, payment_id, payment_provider, is_crypto, is_free, payment_amount) => {

  const result =await pool.query(
    'INSERT INTO transactions (product_id, payment_id, payment_provider, is_crypto, amount_usd, is_free) VALUES ($1, $2, $3, $4, $5, $6) returning id',
    [product_id, payment_id, payment_provider, is_crypto, payment_amount, is_free]
  );

  return result.rows[0].id
}


const createTrialMembership = async() => {

  const txid =await createTransaction(1, 'trial', 'promo', 0, 0, 1)
  const membership = await issueMembershipCodesForOrder(txid)
  return membership
}

const createPaidMembership = async(product_id, payment_id, payment_provider, is_crypto, payment_amount) => {

  const txid= await createTransaction(product_id, payment_id, payment_provider, is_crypto, 0, payment_amount)
  const membership = await issueMembershipCodesForOrder(txid)
  return membership
}


//sets up the API routes for managing subscriptions...
//example usage, if your node.js express app is called app
//const membership = require('./membership/membership');
//membership.httpApi(app, '/api/membership');

const httpApi=(app, endpointBase='/api/membership') => {
  app.get(endpointBase + '/validate-and-apply-code/:encryptedCode', async (req, res) => {
    try {
      const {encryptedCode} = req.params;
      const codeInfo = await validateAndApplyCode(encryptedCode, req);
      res.json(codeInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
  app.get(endpointBase + '/get-code-info/:encryptedCode', async (req, res) => {
    try {
      const {encryptedCode} = req.params;
      const codeInfo = await getCodeInfo(encryptedCode);
      res.json(codeInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })

  app.get(endpointBase + '/products', async (req, res) => {
    const products = await getAllProducts(true);
    res.json(products);
  })
  app.get(endpointBase + '/create-trial-membership', async (req, res) => {
    const membership = await createTrialMembership();
    res.json(membership);
  })
  app.get(endpointBase + '/create-paid-membership', async(req, res) => {
    console.log(JSON.stringify(req.body))

    try {
      const { product_id, payment_id, payment_provider, is_crypto, payment_amount } = req.query;
      
      console.log(JSON.stringify({ product_id, payment_id, payment_provider, is_crypto, payment_amount }))
      
      const membership = await createPaidMembership(product_id, payment_id, payment_provider, is_crypto, payment_amount);
      res.json(membership);
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: error.message });
    }
  })
}
module.exports = {getAllProducts, validateAndApplyCode, getCodeInfo, createTrialMembership, createPaidMembership, httpApi}
  
