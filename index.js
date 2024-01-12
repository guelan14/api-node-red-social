//Importar dependencias
const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");

//Database connection
connection();

//Node server
const app = express();
const port = 3900;

//config cors
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//load routes conf
const UserRoutes = require("./routes/user");
const PublicationRoutes = require("./routes/publication");
const FollowRoutes = require("./routes/follow");

app.use("/api/user", UserRoutes);
app.use("/api/publication", PublicationRoutes);
app.use("/api/follow", FollowRoutes);

//test rute
app.get("/test-rute", (req, res) => {
  return res.status(200).json({
    id: 1,
    nombre: "Migue",
    web: "asdasdasdasd",
  });
});

app.listen(port, () => {
  console.log("Node is running on ", port);
});
