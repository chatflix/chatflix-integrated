//tests the signup, referral, upgrade and commission workflow...
//this is basically a complete integration test for the membership and affiliate systems

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/user';

// Function to generate a random email address
function generateRandomEmail() {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${randomString}@example.com`;
  }
  
async function testWorkflow() {
  try {
    const user1Email = generateRandomEmail();
    const user2Email = generateRandomEmail();


    // Create user 1 (no referral code)
    const user1Signup = await axios.get(`${API_BASE_URL}/signup`, {
      params: {
        email: user1Email,
        password: 'password123',
      },
    });
    const user1 = user1Signup.data.user;
    console.log('User 1 created:', user1);

    // Log user 1 in
    const user1Login = await axios.get(`${API_BASE_URL}/login`, {
      params: {
        email: user1Email,
        password: 'password123',
      },
    });
    console.log('User 1 logged in:', user1Login.data.user);
    const user1Affiliate = user1Login.data.affiliate_info


    // Create user 2 (with user 1's referral code)
    const user2Signup = await axios.get(`${API_BASE_URL}/signup`, {
      params: {
        email:  user2Email,
        password: 'password456',
        referralCode: user1Affiliate.referral_code,
      },
    });
    const user2 = user2Signup.data.user;
    console.log('User 2 created with referral:', user2);

    // Log user 2 in
    const user2Login = await axios.get(`${API_BASE_URL}/login`, {
      params: {
        email: user2Email,
        password: 'password456',
      },
    });
    console.log('User 2 logged in:', user2Login.data.user);

    // Upgrade user 2 to premium membership
    const upgradeResponse = await axios.get(`${API_BASE_URL}/addPremiumMembership`, {
      params: {
        userId: user2.id,
        price: 9.95,
        packageDescription: 'monthly membership',
        durationInDays: 30,
        isRecurring: true,
      },
    });
    console.log('User 2 membership upgraded:', upgradeResponse.data);

    // Log user 1 in and check affiliate info
    const user1LoginAgain = await axios.get(`${API_BASE_URL}/login`, {
      params: {
        email: user1Email,
        password: 'password123',
      },
    });
    const user1AffiliateInfo = user1LoginAgain.data.affiliate_info;
    console.log('User 1 affiliate info:', user1AffiliateInfo);

    // Check if affiliate info reflects the upgrade
    if (
       user1AffiliateInfo.gross_sales_volume == 9.95 &&
      user1AffiliateInfo.net_earnings == 0.995
    ) {
      console.log('Affiliate info updated correctly!');

        //Continue with additional test cases
        
      // 1) Sign up and log in user 3, with invalid referral code
      const user3Email = generateRandomEmail();
      const user3Signup = await axios.get(`${API_BASE_URL}/signup`, {
        params: {
          email: user3Email,
          password: 'password789',
          referralCode: 'INVALID_REFERRAL_CODE', // Using an invalid referral code
        },
      });
      const user3 = user3Signup.data.user;
      console.log('User 3 created:', user3);

      const user3Login = await axios.get(`${API_BASE_URL}/login`, {
        params: {
          email: user3Email,
          password: 'password789',
        },
      });
      console.log('User 3 logged in:', user3Login.data.user);

      // 2) Upgrade user 3 to premium membership
      const user3UpgradeResponse = await axios.get(`${API_BASE_URL}/addPremiumMembership`, {
        params: {
          userId: user3.id,
          price: 19.95,
          packageDescription: 'premium monthly membership',
          durationInDays: 30,
          isRecurring: true,
        },
      });
      console.log('User 3 membership upgraded:', user3UpgradeResponse.data);

      // 3) Log in user 3 and check his membership status
      const user3LoginAgain = await axios.get(`${API_BASE_URL}/login`, {
        params: {
          email: user3Email,
          password: 'password789',
        },
      });
      const user3Membership = user3LoginAgain.data.user.membership_status;
      console.log('User 3 membership status:', user3Membership);
      if (user3Membership && user3Membership == 'valid') {
        console.log('User 3 membership is active!');
      } else {
        console.error('User 3 membership is not active.');
      }

      // 4) Create user 4 with user 1's referral code
      const user4Email = generateRandomEmail();
      const user4Signup = await axios.get(`${API_BASE_URL}/signup`, {
        params: {
          email: user4Email,
          password: 'password101112',
          referralCode: user1Affiliate.referral_code, // Using user 1's referral code
        },
      });
      const user4 = user4Signup.data.user;
      console.log('User 4 created with referral:', user4);

      // 5) Go through the premium upgrade with user 4, but choose a package that's 49.95, duration 365, non-recurring
      const user4UpgradeResponse = await axios.get(`${API_BASE_URL}/addPremiumMembership`, {
        params: {
          userId: user4.id,
          price: 49.95,
          packageDescription: 'annual membership',
          durationInDays: 365,
          isRecurring: false, // Non-recurring
        },
      });
      console.log('User 4 membership upgraded:', user4UpgradeResponse.data);

      // 6) Check user 1's affiliate stats to make sure they got the credit 
      const user1LoginFinal = await axios.get(`${API_BASE_URL}/login`, {
        params: {
          email: user1Email,
          password: 'password123',
        },
      });
      const user1AffiliateFinal = user1LoginFinal.data.affiliate_info;
      console.log('User 1 affiliate info:', user1AffiliateFinal);


    } else {
      console.error('Affiliate info not updated as expected.');
    }
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testWorkflow();
