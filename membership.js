const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const pool = new Pool({ 
  connectionString: 'postgres://vlhklouj:rhWOj82DkgXw4yAAo-0sdhzdxOd1Zkxy@kesavan.db.elephantsql.com/vlhklouj', 
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

  res.json(clientInfo);
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

// Check if a code is valid (not expired and not used)
async function isCodeValid(code) {
  const result = await pool.query(
    'SELECT * FROM membership_codes WHERE code = $1 AND expiry > NOW() AND has_been_used = FALSE',
    [code]
  );
  return result.rows.length > 0;
}

// Generate and save a new code
//app.post('/api/codes', async (req, res) => {
const createDeviceActivationCode = async(transactionId, durationInDays, isFreeTrial) => {
  const code = generateCode();
  const expiry = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000); // Set expiry to 24 hours from now
  const issued = new Date(Date.now())
  try {
    await pool.query(
      'INSERT INTO membership_codes (code, issued, expiry, transaction_id, is_free_trial) VALUES ($1, $2, $3, $4, $5)',
      [code, issued, expiry, transactionId, isFreeTrial]
    );

    const encryptedCode = encryptCode(code, expiry);
    return encryptedCode

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
        'UPDATE membership_codes SET has_been_used = TRUE, notes=$1 WHERE code = $2',
        [activationContext, code]
      );
      return  {
        valid: true,
        expiry: expiry
      }
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error validating code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//given a transaction id, looks up the associated product, and generates the correct number 
//of codes for the duration of the subscription that was purchased. 
//if codes have already been issued, just returns the already issued codes and notes whether they've been used or not
const issueMembershipCodesForOrder = async(transactionId) => {
  try {
    const tx = await pool.query('select * from transactions where id = $1', [transactionId]);
    if (tx.rows.length === 0) {
      throw new Error('Invalid transaction ID');
    }

    //note: free trials have their own product IDs and tx IDs are created when trials are granted
    const product = await pool.query('select * from products where id = $1', [tx.rows[0].product_id]);
    if (product.rows.length === 0) {
      throw new Error('Invalid product ID');
    }
    const isFreeTrial = product.rows[0].price <= 0;
    
  } catch (error) {
    console.error('Error fulfilling order:', error);
  }
};

