
const PAYMENT_SERVER_URL = window.location.href.indexOf('localhost') > 0 ? 'http://localhost:8888' : 'https://payment.chatflix.org';

function decryptCode(encryptedCode) {
    const data = atob(encryptedCode);
    const [code, expiry] = data.split('|');
    return { code, expiry: new Date(expiry) };
  }
  
  function activateDevice(encryptedCode, callback) {
    try {
    //cancel it at the server...
        $.get("/api/membership/validate-and-apply-code/" + encryptedCode, function(data){
          console.log("activateDevice response", data)
          if (data && data.code) {
            localStorage.setItem('membershipCode', encryptedCode);
            //alert(`Success! Your device has now been activated and you are now ready to start streaming. Membership will expire on ${data.expiry.toLocaleString()}. You have ${data.maxDeviceActivations} device activations remaining in your package`);
            callback("success", `Success! Your device has now been activated and you are now ready to start streaming. Membership will expire on ${(new Date(data.expiry)).toLocaleDateString()}. You have ${data.maxDeviceActivations - data.activationCount} device activations remaining in your package`)
          } else {
            //alert("There was an error activating your device. Please try again later.");
            callback("failure", "There was an error activating your device. You may have entered an expired code, or you have exceeded your device activation limit.");
          }
        }).fail(function(error) {
          console.log(error)
          //alert("There was an error activating your device. Please try again later.");
          callback("failure", "There was an error activating your device. You may have entered an expired code, or you have exceeded your device activation limit.");
          
        });

    } catch (error) {
      console.log(error)
      //alert("There was an error activating your device. Please try again later.");
      callback("failure", "There was an error activating your device. You may have entered an expired code, or you have exceeded your device activation limit.");
    }
  }

  function requestCreateFreeTrial(callback) {
    $.get("/api/membership/create-trial-membership", (data) => {
        console.log("requestCreateFreeTrial", JSON.stringify(data))
        if (data && data.code) {
          activateDevice(data.code, (status, message) => {
            console.log("activateDevice", status, message)
            localStorage.setItem('hasHadTrialBefore', true);
            callback("success", "Success! Your free trial has been activated. You are now ready to start streaming. Your trial will expire in 24 hours... Enjoy!")
          })
        } else {
          //alert("There was an error activating your device. Please try again later.");
          callback("failure", "Trial activation failed.");
        }
    })
  }
  
  function getDeviceActivationStatus() {
    const encryptedCode = localStorage.getItem('membershipCode');
  
    if (!encryptedCode) {
      return { status: 'none', expiryDate: null };
    }
  
    const { code, expiry } = decryptCode(encryptedCode);
    const now = new Date();
  
    if (expiry > now) {
      return { status: 'valid', expiryDate: expiry, code: encryptedCode };
    } else {
      // Remove expired code from localStorage
      localStorage.removeItem('membershipCode');
      return { status: 'expired', expiryDate: expiry };
    }
  }

function getMembershipDetails(callback) {
  const deviceActivationStatus=getDeviceActivationStatus();
  if (deviceActivationStatus.status == "valid") {
    const encryptedCode=localStorage.getItem('membershipCode');
    $.get("/api/membership/get-code-info/" + encryptedCode, (data) => {
      console.log("getMembershipDetails", JSON.stringify(data, null, 2))
      deviceActivationStatus.details = data
      callback(deviceActivationStatus)
      //callback(data)
    })
  } else {
    callback(null)
  }
}
  function getMembershipStatus() {
    const activationStatus = getDeviceActivationStatus()
    if (activationStatus.status == "none") {
      const hasHadTrialBefore = localStorage.getItem('hasHadTrialBefore');
      if (!hasHadTrialBefore) {
        return { freeTrialEligible: true, status: activationStatus.status, expiryDate: activationStatus.expiryDate };
      } else {
        return { freeTrialEligible: false, status: activationStatus.status, expiryDate: activationStatus.expiryDate };
      }
    } else {
      return { freeTrialEligible: false, status: activationStatus.status, expiryDate: activationStatus.expiryDate };
    }
  }
  

  function autoFreeTrial() {
    const membershipStatus = getMembershipStatus();
    if (membershipStatus.freeTrialEligible) {
      requestCreateFreeTrial((status, message) => {
        //show a welcome message, then reload
           configureInfoButtons(); showModal("<div style='text-align:center'><h2>Welcome To Chatflix!</h2><p>We have granted you a 72 hour FREE TRIAL - 3 Whole Days of Unlimited Streaming! Please wait 5 seconds while your device is being activated...</p></div>", false)

           setTimeout(function() {
            window.location.reload();
           }, 5000);
      })
    }
  }
  function enforceMembershipForContentPages() {
    const membershipStatus = getMembershipStatus();
  
    if (membershipStatus.status === 'valid') {
      console.log("membership status: valid")
      //todo: set a settings icon in the header to inspect your membership
    } else {
      if (membershipStatus.freeTrialEligible) {
        console.log("membership status: free trial eligible")
        autoFreeTrial()
      }
     else {
            console.log("membership status: paywalled!")
              configureInfoButtons();showModal(`
              <div style="background-color:white">
              <iframe src='${PAYMENT_SERVER_URL}' frameborder='0' style='width:100%; height: 80vh; margin: 0; border:0; padding: 0; overflow-y: scroll; scrollbar-width: thin;'></iframe>
              </div> `, false)


            //Show the payment options, without being able to click out of it...

            //Just in case, unload any juicy media files that are waiting to be streamed
            $("#chatflix-multiplex-player").attr("src", "");
            
          }

      }
  }

