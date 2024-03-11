//import CryptoJS from cdn.jsdelivr.net/npm/crypto-js@3.1.9/+esm
import {CryptoJS} from 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';

const getDeviceIdString = function(txt='Sociopathic HAMster: <g3rmane-g3rBIL;>$# 0390876%$^&$^&', outputContainerId) {
    //Step 1: draw the input text to a canvas, with various styles, so that individual differences in GPU / driver / OS / browser are apparent
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top";
    // The most common type
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(225,1,62,20);
    // Some tricks for color mixing to increase the difference in rendering
    ctx.fillStyle = "#069";
    ctx.fillText(txt, 2, 15); 
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText(txt, 4, 17);


    //Step 2: get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    //Step 3: convert the image data to a string
    const imageString= imageData.reduce((str, val) => str + val.toString(16), '');
    //Step 4: hash the goddamn string
    const deviceId= CryptoJS.SHA256(imageString).toString();

    if (outputContainerId) {
        //show image, hexadecimal string, and device id
        document.getElementById(outputContainerId).innerHTML = `<img src="data:image/png;base64,${imageData}"/><br/>${imageString}<br/>${deviceId}`
    }
}

export {getDeviceIdString}