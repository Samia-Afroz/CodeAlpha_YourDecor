// Creates an admin account (or makes an existing user admin).
//   npm run admin                           -> admin@yourdecor.com / admin123
//   npm run admin -- you@mail.com            -> makes that registered user an admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = (process.argv[2] || 'admin@yourdecor.com').toLowerCase();
    let user = await User.findOne({ email });

    if (user) {
      user.isAdmin = true;
      await user.save();
      console.log(`${email} is now an admin`);
    } else if (!process.argv[2]) {
      await User.create({ name: 'Admin', email, password: 'admin123', isAdmin: true });
      console.log('Admin created -> email: admin@yourdecor.com  password: admin123');
    } else {
      console.log(`No user with email ${email}. Register first, then run this again.`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
