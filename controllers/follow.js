const Follow = require("../models/follow");
const User = require("../models/user");
const mongoosePagination = require("mongoose-paginate-v2");

const followTest = (req, res) => {
  return res
    .status(200)
    .send({ message: "Message sent from controllers/follow.js" });
};

//accion de guardar follo (seguir)
const save = async (req, res) => {
  const params = req.body;
  const identity = req.user;

  let userToFollow = new Follow({
    user: identity.id,
    followed: params.followed,
  });

  try {
    await userToFollow.save();

    return res.status(200).send({
      status: "succes",
      message: "Usuario seguido",
      userToFollow,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "No se ha podido dar follow",
    });
  }
};

const unfollow = async (req, res) => {
  const userId = req.user.id;
  const followedId = req.params.id;
  Follow.plugin(paginate);

  try {
    await Follow.findOneAndDelete({
      user: userId,
      followed: followedId,
    }).exec();
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "No se ha podido hacer el unfollow",
    });
  }

  return res.status(200).send({
    status: "succes",
    message: "usuario unfollowed",
  });
};

const following = async (req, res) => {
  let userId = req.user.id;
  if (req.params.id) userId = req.params.id;
  let pageNumber = 1;
  if (req.params.page) pageNumber = req.params.page;

  try {
    const follows = await Follow.find({ user: userId })
      .limit(5)
      .skip(5 * pageNumber)
      .populate([
        { path: "user", select: "-password -role -__v" },
        { path: "followed", select: "-password -role -__v" },
      ])
      .page(pageNumber)
      .exec();

    const total = await Follow.countDocuments({ user: userId });

    return res.status(200).send({
      status: "success",
      message: "lista de usuarios que sigo",
      follows,
      total,
      pages: Math.ceil(total / 5),
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "hubo un error en el sistema",
    });
  }
};

const followers = (req, res) => {
  return res.status(200).send({
    status: "succes",
    message: "lista de usuarios que me siguen",
  });
};

module.exports = {
  followTest,
  save,
  unfollow,
  following,
  followers,
};
