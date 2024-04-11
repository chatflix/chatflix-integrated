// Function to handle user sign up
async function signUp(email, password, referralCode = null) {
    try {
      const { user, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
  
      if (error) {
        throw error;
      }
  
      // Add the user to the users table
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([{ email: email, password: password }]);
  
      if (insertError) {
        throw insertError;
      }
  
      // If a referral code is provided, create a new affiliate referral record
      if (referralCode) {
        const { data: affiliateData, error: affiliateError } = await supabase
          .from('affiliate_info')
          .select('user_id')
          .eq('referral_code', referralCode)
          .single();
  
        if (affiliateError) {
          console.log("invalid or missing referral code, no affiliate will be bound to this customer")
        } else {
            const { error: referralError } = await supabase
            .from('affiliate_referrals')
            .insert([{ affiliate_user_id: affiliateData.user_id, referred_user_id: user.id }]);
  
        }

      }
  
      return user;
    } catch (error) {
      console.error('Error signing up:', error.message);
      throw error;
    }
  }
  
  // Function to handle user login
  async function login(email, password) {
    try {
      const { user, error } = await supabase.auth.login({
        email: email,
        password: password,
      });
  
      if (error) {
        throw error;
      }
  
      return user;
    } catch (error) {
      console.error('Error logging in:', error.message);
      throw error;
    }
  }
  
  // Function to check if the user is logged in
  async function isLoggedIn() {
    const user = await supabase.auth.user();
    return user !== null;
  }
  
  // Function to get the logged-in user's membership status
  async function getMembershipStatus() {
    try {
      const user = await supabase.auth.user();
  
      if (!user) {
        throw new Error('No user logged in');
      }
  
      const { data, error } = await supabase
        .from('users')
        .select('membership_status')
        .eq('id', user.id)
        .single();
  
      if (error) {
        throw error;
      }
  
      return data.membership_status;
    } catch (error) {
      console.error('Error getting membership status:', error.message);
      throw error;
    }
  }