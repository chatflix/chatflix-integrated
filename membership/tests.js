const membership = require('./membership');

async function testGetAllProductsAsync() {
  console.log('Testing getAllProducts asynchronously...');
  const products = await membership.getAllProducts();
// Perform the same checks as above
    if (!Array.isArray(products)) {
        console.error('FAIL: Expected an array of products, but did not receive an array.');
        return;
    }

    if (products.length === 0) {
    console.warn('WARNING: Received an empty array of products.');
    } else {
    console.log('PASS: getAllProducts returned an array of products.');

    console.log(JSON.stringify(products, null, 2));
    return products
    }
  // If you want to inspect the returned products, uncomment the following line
  // console.log(products);
}


(async () => {

    // this is basically a db connectivity sanity check..,.
    const products = await testGetAllProductsAsync();
    console.log('Testing createTrialMembership...');
    const trialMembership = await membership.createTrialMembership();
    console.log('Trial membership created:', trialMembership);

    // Test createPaidMembership with details for a 30-day membership
    const productId = 3; // assuming this corresponds to a "30 Days" membership
    const paymentId = 'PAY_123456'; // made-up payment ID
    const paymentProvider = 'Stripe'; // made-up payment provider
    const isCrypto = 0; // assuming not paying with cryptocurrency
    const paymentAmount = '9.95'; // price for a "30 Days" membership

    console.log('Testing createPaidMembership...');
    const paidMembership = await membership.createPaidMembership(productId, paymentId, paymentProvider, isCrypto, paymentAmount);
    console.log('Paid membership created:', paidMembership);


        // Test with a valid code from paidMembership
        console.log('Activate 1st device from paidMembership...');
        const validPaidCode = paidMembership.code;
        console.log('Using code:', validPaidCode);
        let result = await membership.validateAndApplyCode(validPaidCode);
        console.log('Result:', result);
    
        // Assert: 1 code used of 3
        let codeInfo = await membership.getCodeInfo(validPaidCode);
        console.log('Code info:', codeInfo);
        if (codeInfo.activationCount !== 1) {
            console.error('FAIL: Expected code to be used once, but it was not.');
        } else {
            console.log("PASS: Code was used once.");
        }

        // Test with a valid code from trialMembership
        console.log('Activate 1st device from trialMembership...');
        const validTrialCode = trialMembership.code;
        console.log('Using code:', validTrialCode);
        result = await membership.validateAndApplyCode(validTrialCode);
        console.log('Result:', result);
    
        // Activate an additional device from paidMembership
        console.log('Testing validateAndApplyCode with a valid paid membership code...');
        console.log('Using code:', validPaidCode);
        result = await membership.validateAndApplyCode(validPaidCode);
        console.log('Result:', result);
    
        // Assert: 2 code used of 3
        codeInfo = await membership.getCodeInfo(validPaidCode);
        console.log('Code info:', codeInfo);
        if (codeInfo.activationCount !== 2) {
            console.error('FAIL: Expected code to be used twice, but it was not.');
        } else {
            console.log("PASS: Code was used twice.");
        }

        // Test with a made-up (invalid) code

        try {
            console.log('Testing validateAndApplyCode with an invalid code...');
            const invalidCode = 'invalidcode123';
            console.log('Using code:', invalidCode);
            result = await membership.validateAndApplyCode(invalidCode);
            console.log('Result:', result);
        } catch (error) {
            console.error('Error:', error);
        }


        try
        {
            // Test a code that was valid but has reached its max activations
            console.log('Test activation limit on trial membership...');
            console.log('Using code:', validTrialCode);
            result = await membership.validateAndApplyCode(validTrialCode);
            console.log('Result:', result);
        }
        catch (error) {
            console.error('Error:', error);
        }
    
  })();
  