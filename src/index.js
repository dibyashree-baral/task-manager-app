const express = require("express");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
require("./database/mongoose");

const app = express();
const port = process.env.PORT;
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log(`Server is up and running at ${port}`);
});
