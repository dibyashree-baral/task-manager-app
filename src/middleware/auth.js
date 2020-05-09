const jwt = require("jsonwebtoken");
const UserModel = require("../model/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findOne({
      _id: decodedToken._id,
      "tokens.token": token,
    });
    if (!user) throw new Error();
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send({ error: "Unauthorized User" });
  }
};

module.exports = auth;
