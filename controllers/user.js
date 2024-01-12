const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt");
const mongoosePagination = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");
//test

const userTest = (req, res) => {
  return res.status(200).send({
    message: "Message sent from controllers/user.js",
    user: req.user,
  });
};

//user registration
const register = (req, res) => {
  //load data from request
  let params = req.body;

  //check + validation
  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).json({
      status: "error",
      message: "Need more data",
    });
  }

  //control duplication
  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() },
    ],
  })
    .then(async (users) => {
      if (users && users.length >= 1) {
        return res.status(200).send({
          status: "success",
          message: "The user already exists",
        });
      }

      // password encryption
      let pwd = await bcrypt.hash(params.password, 10);
      params.password = pwd;

      //create user object
      let user_to_save = new User(params);

      // save user in db
      user_to_save
        .save()
        .then((userStored) => {
          return res.status(200).json({
            status: "success",
            message: "Registration success",
            user: userStored,
          });
        })
        .catch((error) => {
          return res.status(500).send({
            status: "error",
            message: "Error in saving the user",
          });
        });
    })
    .catch((error) => {
      return res
        .status(500)
        .json({ status: "error", message: "Error en la consulta de usuarios" });
    });
};

const login = (req, res) => {
  //load paramatters
  const params = req.body;
  if (!params.email || !params.password) {
    return res
      .status(400)
      .send({ status: "error", message: "not enough data" });
  }

  //find in db if exists
  User.findOne({ email: params.email })
    //.select({ password: 0 })
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          status: "error",
          message: "coudnt find any user: " + params.email,
        });
      } else {
        //check password
        let pwd = bcrypt.compareSync(params.password, user.password);
        if (!pwd) {
          return res.status(400).send({
            status: "error",
            message: "Information not valid",
          });
        }
        //return token
        const token = jwt.createToken(user);

        //return user data

        return res.status(200).send({
          status: "succes",
          message: "login succesful",
          user: { name: user.name, id: user._id, nick: user.nick },
          token,
        });
      }
    });
};

const profile = (req, res) => {
  //get id from user
  const id = req.params.id;
  //get user data

  async function obtenerUsuario(req, res) {
    try {
      const userProfile = await User.findById(id)
        .select({ password: 0, role: 0 })
        .exec();

      if (!userProfile) {
        return res.status(404).send({
          status: "error",
          message: "El usuario no existe",
        });
      }

      return res.status(200).send({
        status: "success",
        user: userProfile,
      });
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "Error al buscar el usuario",
        error: error.message,
      });
    }
  }

  // Llamada a la función
  obtenerUsuario(req, res);

  //send results
};

const list = (req, res) => {
  //controlar la pagina
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }
  page = parseInt(page);

  //consulta con mongoos paginate
  let itemsPerPage = 1;

  User.find()
    .sort("_id")
    .paginate(page, itemsPerPage)
    .then((users, total) => {
      if (!users) {
        return res.status(404).send({
          message: "No hay usuarios disponibles",
          page,
        });
      }

      return res.status(200).send({
        users,
        itemsPerPage,
        total,
        pages: Math.ceil(total / itemsPerPage),
      });
    })
    .catch((error) => {
      return res.status(500).send({ message: "error en la busqueda" });
    });
};

const update = async (req, res) => {
  try {
    const userIdentity = req.user;
    const userToUpdate = req.body;

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    let userIsSet = false;

    // Buscar si el email o el nick ya existen en otro usuario
    const users = await User.find({
      $or: [
        { email: userToUpdate.email.toLowerCase() },
        { nick: userToUpdate.nick.toLowerCase() },
      ],
    });

    // Comprobar si hay algún usuario que coincida y no sea el mismo que se quiere actualizar
    users.forEach((user) => {
      if (user && user._id != userIdentity.id) userIsSet = true;

      if (userIsSet) {
        return res.status(200).send({
          status: "error",
          message: "The user already exists",
        });
      }
    });

    // Encriptar la contraseña si se cambia
    if (userToUpdate.password) {
      const pwd = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = pwd;
    }

    // Actualizar solo las propiedades que cambian en el documento
    const updatedUser = await User.findByIdAndUpdate(
      userIdentity.id,
      { $set: userToUpdate },
      { new: true }
    );

    // Enviar la respuesta con el usuario actualizado
    return res.status(200).send({
      status: "success",
      message: "metodo de actualizar usuario",
      updatedUser,
    });
  } catch (error) {
    // Enviar la respuesta con el error
    return res.status(500).send({
      status: "error",
      message: error.message,
    });
  }
};

const upload = async (req, res) => {
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

  let userUpdated = await User.findOneAndUpdate(
    { _id: req.user.id },
    { image: req.file.filename },
    {
      returnOriginal: false,
    }
  );

  if (!userUpdated) {
    return res.status(500).send({
      status: "error",
    });
  } else {
    return res.status(200).send({
      status: "succes",
    });
  }
};

const avatar = async (req, res) => {
  const file = req.params.file;
  const filePath = "./uploads/avatars/" + file;
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

//Acciones Exports
module.exports = {
  userTest,
  register,
  login,
  list,
  profile,
  update,
  upload,
  avatar,
};
