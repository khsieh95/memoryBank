const express = require("express");
// const { HSTORE } = require("sequelize");
const router = express.Router();
const db = require("../models");
const { Op } = require("sequelize");

// / route to the welcome page
router.get("/", async function (req, res) {
  if (req.session.user) {
    console.log("logged in !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    var lastEntry = await getLastEntry(req.session.user.id);
    db.daily_history
      .findOne({
        where: { createdAt: lastEntry.createdAt },
        include: [db.user_data],
      })
      .then((data) => {
        data.dataValues.createdAt = convertDate(data.dataValues.createdAt);
        const hbsObj = {
          histories: data.dataValues,
          users: data.dataValues.user_datum.dataValues,
        };
        res.render("userHome", hbsObj);
      });
  } else {
    console.log("logged out !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    res.render("index");
  }
});

// /login route to go to login page
router.get("/login", function (req, res) {
  res.render("login", { user: req.session.user });
});

// /create route from welcome page to create user page
router.get("/create", (req, res) => {
  res.render("create", { user: req.session.user });
});

//route to destroy active session cookie
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// /home route for after login user goes to their home page
// users home page will always display the most recent data for that day
router.get("/home", async function (req, res) {
  if (req.session.user) {

    var lastEntry = await getLastEntry(req.session.user.id);
    db.daily_history
      .findOne({
        where: { createdAt: lastEntry.createdAt },
        include: [db.user_data],
      })
      .then((data) => {
        data.dataValues.createdAt = convertDate(data.dataValues.createdAt);
        const hbsObj = {
          histories: data.dataValues,
          users: data.dataValues.user_datum.dataValues,
        };
        res.render("userHome", hbsObj);
      });
  } else {
    res.redirect('/')
  }
});

// /history route that the user can visit once logged in from the burger bar in the top right to view past entries order by most recent day
router.get("/history", function (req, res) {
  db.daily_history
    .findAll({
      where: { userDatumId: req.session.user.id },
      include: [db.user_data],
      order: [["createdAt", "DESC"]],
    })
    .then((data) => {
      // data[0].createdAt = convertDate(data[0].createdAt);

      const jsonData = data.map((obj) => {
        const jsonObj = obj.toJSON();
        return jsonObj;
      });
      const hbsObj = {
        histories: jsonData,
      };
      console.log(jsonData);
      res.render("history", hbsObj);
    });
});

router.get("/:term", (req, res) => {
  db.user_data
    .findAll({
      where: {
        [Op.or]: [
          { user_name: req.params.term },
          { first_name: req.params.term },
          { last_name: req.params.term },
          { sign: req.params.term },
          { email: req.params.term },
        ],
      },
    })
    .then((data) => {
      const jsonData = data.map((obj) => {
        const jsonObj = obj.toJSON();
        return jsonObj;
      });
      const hbsObj = {
        data: jsonData,
      };
      res.render("testsearch", hbsObj);
    });
});

//returns the most recent entry for the logged in user
function getLastEntry(data) {
  return new Promise((resolve, reject) => {
    db.daily_history
      .findAll(
        { where: { userDatumId: data } },
        { limit: 1, order: [["createdAt", "DESC"]] }
      )
      .then((data) => {
        resolve(data[0]);
      });
  });
}

// get todays date formatted as mm/dd/yyyy
function convertDate(x) {
  let dd = String(x.getDate()).padStart(2, "0");
  let mm = String(x.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = x.getFullYear();
  x = mm + "/" + dd + "/" + yyyy;
  return x;
}

module.exports = router;
