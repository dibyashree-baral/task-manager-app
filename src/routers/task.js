const express = require("express");
const taskRouter = new express.Router();
const TaskModel = require("../model/task");
const auth = require("../middleware/auth");

taskRouter.post("/tasks", auth, async (req, res) => {
  const task = new TaskModel({ ...req.body, owner: req.user._id });
  try {
    const taskRes = await task.save();
    res.status(201).send(taskRes);
  } catch (e) {
    res.status(400).send(e);
  }
});

taskRouter.get("/tasks", auth, async (req, res) => {
  const match = req.query.completed
    ? {
        completionStatus: req.query.completed.toLowerCase() === "true",
      }
    : {};
  const sort = {};
  const sortArr = req.query.sortBy && req.query.sortBy.split(":");
  sort[sortArr[0]] = sortArr[1] === "desc" ? -1 : 1;
  console.log(sort);
  try {
    const data = await TaskModel.find({ owner: req.user._id, ...match })
      .sort(sort)
      .skip(parseInt(req.query.skip))
      .limit(parseInt(req.query.limit));
    res.send(data);
  } catch (e) {
    res.status(500).send();
  }
});

taskRouter.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const data = await TaskModel.findOne({ _id, owner: req.user._id });
    if (!data) return res.status(404).send();
    res.send(data);
  } catch (e) {
    res.status(500).send(e);
  }
});

taskRouter.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const allowedFieldsToUpdate = ["description", "completionStatus"];
  const fieldsToUpdate = Object.keys(req.body);
  if (fieldsToUpdate.length === 0)
    return res.status(404).send({ error: "Empty request body" });
  const isAllowedToUpdate = fieldsToUpdate.every((key) =>
    allowedFieldsToUpdate.includes(key)
  );
  if (!isAllowedToUpdate)
    return res.status(404).send({ error: "Invalid fields to validate" });
  try {
    const task = await TaskModel.findOne({ _id, owner: req.user._id });
    if (!task) return res.status(404).send();
    fieldsToUpdate.forEach((key) => (task[key] = req.body[key]));
    const savedTask = await task.save();
    res.status(201).send(savedTask);
  } catch (e) {
    res.status(400).send();
  }
});

taskRouter.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const deletedTask = await TaskModel.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    console.log(deletedTask);
    if (!deletedTask) return res.status(404).send();
    res.send(deletedTask);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = taskRouter;
