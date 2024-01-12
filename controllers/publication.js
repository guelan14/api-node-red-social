const Publication = require("../models/publication");

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

//Acciones Exports
module.exports = {
  publicationTest,
  save,
  detail,
  remove,
};
