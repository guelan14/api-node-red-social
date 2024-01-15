const Publication = require("../models/publication");
const fs = require("fs");
const path = require("path");
const followService = require("../services/followService");

const publicationTest = (req, res) => {
  return res
    .status(200)
    .send({ message: "Message sent from controllers/publication.js" });
};

const save = async (req, res) => {
  const params = req.body;

  if (!params.text)
    return res.status(400).send({
      status: "error",
      message: "debes enviar un texto en la publicacion",
    });

  let newPublication = new Publication(params);
  console.log(req.user.id);
  newPublication.user = req.user.id;
  try {
    const publicationStored = await newPublication.save();
    return res.status(200).send({
      status: "succes",
      massage: "publicacion guardada",
      publicationStored,
    });
  } catch {
    return res.status(400).send({
      status: "error",
      message: "no se puso guardar",
    });
  }
};

const detail = async (req, res) => {
  const publicationId = req.params.id;

  try {
    const publicationStored = await Publication.findById(publicationId);

    return res.status(200).send({
      status: "succes",
      message: "mostrar publicacion",
      publication: publicationStored,
    });
  } catch {
    return res.status(400).send({
      status: "error",
      message: "no se encontro ninguna publicacion",
    });
  }
};

const remove = async (req, res) => {
  const publicationId = req.params.id;
  console.log(publicationId);

  try {
    const publicationDeleted = await Publication.findOneAndDelete({
      user: req.user.id,
      _id: publicationId,
    });

    return res.status(200).send({
      status: "succes",
      massage: "publicacion eliminada",
      publicationDeleted,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "no se ha eliminado la publicacion",
    });
  }
};

const user = async (req, res) => {
  const userId = req.params.id;

  let page = 1;

  if (req.params.page) {
    page = req.params.page;
  }
  const itemsPerPage = 5;
  try {
    const publications = await Publication.find({ user: userId })
      .populate("user", "-password -__v -role")
      .paginate(page, itemsPerPage);

    let total = await Publication.find({ user: userId });
    totalNum = total.length;

    return res.status(200).send({
      status: "succes",
      totalNum,
      page,
      pages: Math.ceil(totalNum / itemsPerPage),
      massage: "publicaciones del usuario",
      user: req.user,
      publications,
    });
  } catch (error) {
    return res.status(404).send({
      status: "error",
    });
  }
};

const upload = async (req, res) => {
  const publicationId = req.params.id;

  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "Peticion no incluye imagen",
    });
  }

  let image = req.file.originalname;

  const imageSplit = image.split(".");
  const extension = imageSplit[1];

  if (extension != "png" && extension != "jpg" && extension != "gif") {
    const filePath = req.file.path;
    const fileDeleted = fs.unlinkSync(filePath);

    return res.status(400).send({
      status: "error",
      message: "extension del fichero invalida",
    });
  }

  try {
    let publicationUpdated = await Publication.findOneAndUpdate(
      { user: req.user.id, _id: publicationId },
      { file: req.file.filename },
      {
        returnOriginal: false,
      }
    );
    return res.status(200).send({
      status: "succes",
      publication: publicationUpdated,
      file: req.file,
    });
  } catch {
    const filePath = req.file.path;

    const fileDeleted = fs.unlinkSync(filePath);

    return res.status(404).send({
      status: "error, no se encontro la publicacion",
    });
  }
};

const media = async (req, res) => {
  const file = req.params.file;
  const filePath = "./uploads/publications/" + file;
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).send({
        status: "error",
        Message: "No existe la imagen",
      });
    }
    return res.sendFile(path.resolve(filePath));
  });
};

const feed = async (req, res) => {
  let page = 1;
  if (req.params.page) page = req.params.page;

  const itemsPerPage = 5;
  try {
    const myFollows = await followService.followUserIds(req.user.id);
    const publications = await Publication.find({ user: myFollows.following })
      .populate("user", "-password -role -email")
      .sort("-created_at")
      .paginate(page, itemsPerPage);
    return res.status(200).send({
      status: "succes",
      message: "Feed de publicaciones",
      myFollows: myFollows.following,
      publications,
    });
  } catch (error) {
    return res.status(200).send({
      status: "succes",
      message: "no se ha cargado el feed",
    });
  }
};

//Acciones Exports
module.exports = {
  publicationTest,
  save,
  detail,
  remove,
  user,
  upload,
  media,
  media,
  feed,
};
