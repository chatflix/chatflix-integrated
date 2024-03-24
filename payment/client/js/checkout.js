function resultMessage(message) {
    const container = document.querySelector("#result-message");
    container.innerHTML = message;
  }

  function displayProductInfo(product) {
  
  
      // Calculate the expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + product.membership_duration);
      const expirationDateString = expirationDate.toISOString().split('T')[0];
  
      // Create the product info HTML
      const productInfoHtml = `
          <div class="product-info">
              <h3>${product.membership_duration} Days / $${product.price}</h3>
              <p>Valid Now thru ${expirationDateString}</p>

              <p><em>Includes unlimited streaming, cast to Smart TV / streaming device, and family sharing on up to ${product.max_activations} devices<em></p>
          </div>
      `;
  
      // Insert the product info HTML into the page
      $('#products-container').html(productInfoHtml);
  
      // Return product details as JSON (for potential further use)
      return JSON.stringify({
          ...product,
          actual_price: product.price
      });
  }
      const getQueryParams = (name) => {
        const params = {};
        window.location.search.slice(1).split('&').forEach(param => {
          const [key, value] = param.split('=');
          params[key] = value;
        });
        if (name) return params[name]
        return params;
      }
      let baseURL = window.CHATFLIX_BASE_URL
      $(document).ready(function() {
        $.ajax({
          url: baseURL+'/api/membership/products',
          type: 'GET',
          dataType: 'json',
          success: function(products) {
            
            const product_id= getQueryParams('product_id')
            const product = products.find(product => product.id == product_id)
            if (!product) {
              console.error('Product not found');
              return;
            }
            window.productDetailsJson =displayProductInfo(product);
            window.productID = product.id
            window.paypal
              .Buttons({
                style: {
                  height: 50,
                },
                async createOrder() {
                  try {
                    const response = await fetch("/api/orders", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      // use the "body" param to optionally pass additional order information
                      // like product ids and quantities
                      body: JSON.stringify({
                        cart: [
                          window.productDetailsJson            
                        ],
                        productID: window.productID
                      }),
                    });

                    const orderData = await response.json();

                    if (orderData.id) {
                      return orderData.id;
                    } else {
                      const errorDetail = orderData?.details?.[0];
                      const errorMessage = errorDetail
                        ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                        : JSON.stringify(orderData);

                      throw new Error(errorMessage);
                    }
                  } catch (error) {
                    console.error(error);
                    resultMessage(`Could not initiate PayPal Checkout...<br><br>${error}`);
                  }
                },
                async onApprove(data, actions) {
                  try {
                    const response = await fetch(`/api/orders/${data.orderID}/capture`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                    });

                    const orderData = await response.json();
                    // Three cases to handle:
                    //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                    //   (2) Other non-recoverable errors -> Show a failure message
                    //   (3) Successful transaction -> Show confirmation or thank you message

                    const errorDetail = orderData?.details?.[0];

                    if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                      // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                      // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                      return actions.restart();
                    } else if (errorDetail) {
                      // (2) Other non-recoverable errors -> Show a failure message
                      throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
                    } else if (!orderData.purchase_units) {
                      throw new Error(JSON.stringify(orderData));
                    } else {
                      // (3) Successful transaction -> Show confirmation or thank you message
                      // Or go to another URL:  actions.redirect('thank_you.html');
                      console.log(JSON.stringify(orderData, null, 2))
                      //actions.redirect('http://localhost:5000/activate.html?code=' + orderData.chatflix_membership.code)
                      //keep it inside the frame
                      window.location.href= baseURL+'/activate.html?code=' + orderData.chatflix_membership.code
                      
                    }
                  } catch (error) {
                    console.error(error);
                    resultMessage(
                      `Sorry, your transaction could not be processed...<br><br>${error}`,
                    );
                  }
                },
              })
              .render("#paypal-button-container");
          },
          error: function(error) {
            console.error(error);
          }
        })

        
      });
