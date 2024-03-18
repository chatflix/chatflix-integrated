function decryptCode(encryptedCode) {
    const data = atob(encryptedCode);
    const [code, expiry] = data.split('|');
    return { code, expiry: new Date(expiry) };
  }
  
  function activateDevice(encryptedCode, callback) {
    //cancel it at the server...
    $.get("/api/membership/validate-and-apply-code/" + encryptedCode, function(data){
      if (data && data.code) {
        localStorage.setItem('membershipCode', encryptedCode);
        alert(`Chatflix VIP has been activated on this device, and is valid until ${data.expiry.toLocaleString()}. You have ${data.maxDeviceActivations} device activations remaining in your package`);
        callback(data)
      }
    });
  }
  
  function getDeviceActivationStatus() {
    const encryptedCode = localStorage.getItem('membershipCode');
  
    if (!encryptedCode) {
      return { status: 'none', expiryDate: null };
    }
  
    const { code, expiry } = decryptCode(encryptedCode);
    const now = new Date();
  
    if (expiry > now) {
      return { status: 'valid', expiryDate: expiry };
    } else {
      // Remove expired code from localStorage
      localStorage.removeItem('membershipCode');
      return { status: 'expired', expiryDate: expiry };
    }
  }
  
  function enforceMembership(onSuccess, onFailure) {
    const membershipStatus = getMembershipStatus();
  
    if (membershipStatus.status === 'valid') {
      onSuccess();
    } else {
      onFailure();
    }
  }
