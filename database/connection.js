const mongoose = require("mongoose");

const connection = async() => {
  const url = "mongodb://127.0.0.1:27017/social-red";

  try {
    await mongoose.connect(url);
    console.log("conectado correctamente");
  } catch (error) {
    console.log(error);
    throw new error(" Conexion to DB failed");
  }

};

module.exports = connection;
