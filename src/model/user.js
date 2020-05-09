const moongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = moongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    validate(value) {
      if (value < 0) {
        throw Error("Age must be a positive number");
      }
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw Error("Invalid email");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase().includes("password")) {
        throw Error("Invalid password");
      }
    },
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  avatar:{
    type: Buffer
  }
},{timestamps:true});

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    "mySecretKeyForNodeApp",
    {
      expiresIn: "7 days",
    }
  );
  user.tokens = user.tokens.concat({ token });
  const result = await user.save();
  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const newUserObj = user.toObject();
  delete newUserObj.password;
  delete newUserObj.tokens;
  delete newUserObj.avatar;
  return newUserObj;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("Login unsuccessful");
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Login unsuccessful");
  return user;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password"))
    user.password = await bcrypt.hash(user.password, 8);
  console.log("before saving");
  next();
});

userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({owner:user._id});
  next();
});

const UserModel = moongoose.model("User", userSchema);

module.exports = UserModel;
