const express = require('express');
const app = express();
const PORT = 4000;

const cors = require('cors');
app.use(cors());

const userRoute = require('./routes/user.route');
const auth = require('./routes/auth.route');
const presensiRoute = require('./routes/presensi.route');

// Using the routes
app.use('/api/auth', auth);
app.use('/user', userRoute);
app.use('/api/presensi', presensiRoute);

app.listen(PORT, () => {
    console.log(`Server of online presensi runs on port ${PORT}`);
});
