const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const loginRoutes = require('./routes/loginRoutes');
const checkTrackingRoutes = require('./routes/checkTrackingRoutes');
dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/tracking', checkTrackingRoutes);
app.use('/auth', loginRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
