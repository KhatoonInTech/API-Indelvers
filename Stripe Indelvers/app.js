
require('dotenv').config()
const express = require('express')
const bodyparser = require('body-parser')
const path = require('path')
const app = express()

const stripe = require('stripe')(process.env.SECRET_KEY)

app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

const port = 4000;
process.env.NODE_NO_WARNINGS = 1;


  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
 

app.get('/', (req, res) => {
  res.render('index', {
    key: process.env.PUBLISHABLE_KEY
});
});

app.post('/payment', async function(req, res) {
  try {
    const customer = await stripe.customers.create({
      source: req.body.stripeToken,
      email: req.body.email,  // Collected from your form
      name: req.body.name,    // Collected from your form
      address: {
        line1: req.body.address_line1,
        postal_code: req.body.postal_code,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
      }
    
    });

    const charge = await stripe.charges.create({
      amount: req.body.amount,
      description: req.body.plan,
      currency: 'USD',
      customer: customer.id
    });

    res.send("<h2>Payment Successful</h2><p>You have successfully subscribed to the " + req.body.plan + " plan.</p>");
  } catch (err) {
    console.error('Stripe Error:', err);
    res.status(500).send("<h2>Payment Failed</h2><p>Error: " + err.message + "</p>");
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});