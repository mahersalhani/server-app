const fs = require("fs");
const path = require("path");
const dns = require("dns");
const { exec } = require("child_process");
const { firestore } = require("./firebaseConfig");

const express = require("express");
const app = express();
const cors = require("cors");
const slugify = require("slugify");
const { writeConfig } = require("./logic/writeConfig");
const dotenv = require("dotenv");
const { createContainer } = require("./logic/createContainer");

const usersPath = path.join(__dirname, "..", "users");

const PORT = process.env.PORT || 8000;

app.use(express.json());
dotenv.config({ path: "./conf.env" });

// // allows to access routes

var whitelist = [`http://${process.env.DOMAIN_NAME}`, "http://example2.com"];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

const confFile = path.join(__dirname, "..", "..", "nginx", "conf", "sites-enabled");

app.post("/api/dns", async (req, res, next) => {
  const lookupPromise = new Promise((resolve, reject) => {
    dns.lookup("instagram.com", (err, address, family) => {
      if (err) reject(err);
      resolve(address);
    });
  });

  try {
    const address = await lookupPromise;
    res.json({ address });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/create-user", async (req, res) => {
  const username = "maher salhany";

  const dir = path.join(usersPath, slugify(username, { lower: true }));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify({ username }));
  } else {
    fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify({ username }));
  }

  // fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify({ username }));

  res.status(200).json({ msg: "succeed" });
});

app.post("/api/sing-up", async (req, res) => {
  const { email, firstName, lastName, uid } = req.body;

  try {
    await firestore.collection("users").doc(uid).set({
      email,
      firstName,
      lastName,
    });

    res.status(200).json({ msg: "succeed" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "failed" });
  }
});

app.post("/api/create-new-shop", async (req, res) => {
  const { shopName, shopDescription, userID, template, port } = req.body;

  const slugShopName = slugify(shopName, { lower: true });

  const dir = path.join(usersPath, slugShopName);

  try {
    const alreadyExist = await firestore.collection("shops").where("shopName", "==", shopName).get();

    if (!alreadyExist.empty) {
      console.log("already exist");
      return res.status(400).json({ msg: "shop name already exist" });
    }

    const shopRef = await firestore.collection("shops").add({
      shopName,
      shopDescription,
      userID,
      domin: `${slugShopName}.${process.env.DOMAIN_NAME}`,
      port,
    });

    const shopDeploymentName = slugify(shopName, { lower: true, replacement: "-" });

    createContainer(port, shopDeploymentName);
    writeConfig(slugShopName, template, port);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify({ shopName, shopDescription, userID, domin: `${slugShopName}.${process.env.DOMAIN_NAME}` }));
    } else {
      fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify({ shopName, shopDescription, userID, domin: `${slugShopName}.${process.env.DOMAIN_NAME}` }));
    }

    res.status(200).json({ msg: "succeed", shopID: shopRef.id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "failed" });
  }
});

app.listen(PORT, (req, res) => {
  console.log(`Server is running on port ${PORT}`);
});
