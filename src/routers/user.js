const express = require("express");
const userRouter = new express.Router();
const UserModel = require("../model/user");
const {welcomeMail,accountDeletionMail} = require('../email/account');
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");

userRouter.post("/users", async (req, res) => {
  const user = new UserModel(req.body);
  try {
    const token = await user.generateAuthToken();
    const response = await user.save();
    welcomeMail(user.name, user.email);
    res.status("201").send({ response, token });
  } catch (e) {
    res.status("400").send(e);
  }
});

userRouter.get("/users/profile", auth, async (req, res) => {
  try {
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

userRouter.get("/users", auth, async (req, res) => {
  try {
    const data = await UserModel.find({});
    res.send(data);
  } catch (e) {
    res.status(500).send();
  }
});

userRouter.get("/users/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const data = await UserModel.findById(_id);
    if (!data)
      return res.status(404).send({ error: "404 resource not found error" });
    res.send(data);
  } catch (e) {
    res.status(500).send(e);
  }
});

userRouter.patch("/users/me", auth, async (req, res) => {
  // const _id = req.params.id;
  const allowedFieldsToUpdate = ["name", "age", "email", "password"];
  const inputKeysToUpdate = Object.keys(req.body);
  if (inputKeysToUpdate.length === 0)
    return res.status(404).send({ error: "bad request" });
  const isAllowedToUpdate = inputKeysToUpdate.every((updateKey) =>
    allowedFieldsToUpdate.includes(updateKey)
  );
  if (!isAllowedToUpdate)
    return res.status(404).send({ error: "Invalid fields to update" });

  try {
    // const user = await UserModel.findById(_id);
    // if (!user) return res.status(404).send();
    inputKeysToUpdate.forEach((key) => (req.user[key] = req.body[key]));
    const savedUser = await req.user.save();
    res.status(201).send(savedUser);
  } catch (e) {
    res.status(400).send(e);
  }
});

userRouter.delete("/users/me", auth, async (req, res) => {
  try {
    // const deletedUser = await UserModel.findByIdAndDelete(req.user._id);
    // if (!deletedUser) return res.status(404).send();
    const deletedUser = await req.user.remove();
    accountDeletionMail(req.user.name, req.user.email);
    res.send(deletedUser);
  } catch (e) {
    res.status(500).send();
  }
});

userRouter.post("/users/login", async (req, res) => {
  try {
    const user = await UserModel.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

userRouter.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

userRouter.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

const multerInstance = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error("File must be of .jpg,.jpeg or .png format"));
    }
    callback(undefined, true);
  },
});

userRouter.post(
  "/users/me/avatar",
  multerInstance.single("avatar"),
  auth,
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 250, width: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

userRouter.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

userRouter.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user || !user.avatar) throw new Error("No image found");
    res.set("content-type", "image/jpg");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send(e);
  }
});

module.exports = userRouter;
