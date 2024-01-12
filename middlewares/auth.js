//import modul
const jwt = require("jwt-simple");
const moment = require("moment");

//import secret key
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

//authentication middleware
exports.auth = (req, res, next) => {
  //check auth
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "la peticion no tiene la cabecera de autenticacion",
    });
  }

  //token deco
  let token = req.headers.authorization.replace(/['"]+/g, ""); //limpiar

  try {
    let payload = jwt.decode(token, secret);
    //comprobar expiracion del token
    if (payload.exp <= moment().unix()) {
      return res
        .status(401)
        .send({ status: "error", message: "token expired" });
    }
    //add user data a request
    req.user = payload;
  } catch {
    return res.status(404).send({ status: "error", message: "token error" });
  }

  //action
  next();
};
