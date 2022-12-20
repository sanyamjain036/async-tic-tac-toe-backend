const {errorHandler} = require('./middleware/errorMiddleware')
const express = require("express");
const connectDB = require("./db");
const cors = require('cors')
require('colors');
require("dotenv").config();

const app = express();
connectDB();

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World!");
  });

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));

//custom error handler
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`.green.underline);
});
