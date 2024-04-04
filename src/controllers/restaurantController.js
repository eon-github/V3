const express = require("express");
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://maxeneallison:tiQi88bNBTCJdlVT@cluster0.3htzzpu.mongodb.net/";

const bcrypt = require("bcrypt");
const saltRounds = 10;

const { User } = require("../models/db.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadDir = path.join(__dirname, "..", "public", "images");
// app.use(express.static(path.join(__dirname, 'src', 'public')));

async function connectToDB() {
  try {
    const client = await MongoClient.connect(uri);
    return client.db("eggyDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function getData(collectionName, query = {}) {
  try {
    const db = await connectToDB();
    const collection = db.collection(collectionName);
    return await collection.find(query).toArray();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
function cutShort(sentence) {
  let newSentence = sentence;

  if (sentence.length > 120) {
    newSentence = sentence.slice(0, 120) + "...";
  }

  return newSentence;
}


module.exports = function (app, app_data) {
  //Data Models or Schemas
  const restoModel = app_data["restoModel"];
  const userModel = app_data["userModel"];
  const feedbackModel = app_data["feedbackModel"];
  const commentModel = app_data["commentModel"];

  const { check, body, validationResult } = require("express-validator");

  let loginInfo;

  // Function to load server data
  async function loadServer(req, res, data) {
    try {
      //used the Mini Challenge 3 as reference to retrieve data
      const resto = await restoModel.find({}).lean();
      const searchQuery = { restoName: resto[0].restoName };
      const comments = await commentModel.find(searchQuery).lean();

      // const users = await userModel.find({}, 'username email').lean();
      // console.log(users);

      for (let i = 0; i < comments.length; i++) {
        let ratingCountArray = [];
        comments[i].content = cutShort(comments[i].content);
        for (let j = 0; j < comments[i]["overall-rating"]; j++) {
          ratingCountArray.push(j);
        }
        comments[i]["ratingCount"] = ratingCountArray;
      }

      res.render("main", {
        layout: "index",
        title: "My Home page",
        restoData: resto,
        loginData: data,
        commentData: comments,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    }
  }
  // Connect to MongoDB
  connectToDB().catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

  // Routes
  app.get("/", (req, res) => {
    console.log(loginInfo);
    loadServer(req, res, loginInfo);
  });

  app.post("/update-image", async (req, res) => {
    try {
      const images = await restoModel.find({}).lean();

      let i = Number(req.body.input);
      //console.log(`Current index ${i}`);

      //get restoName first
      const restoNames = await restoModel.find({}, "restoName").lean();

      //get restaurant comments based on restaurant names from restoNames
      let resto1 = await commentModel
        .find({ restoName: restoNames[0].restoName })
        .lean();
      let resto2 = await commentModel
        .find({ restoName: restoNames[1].restoName })
        .lean();
      let resto3 = await commentModel
        .find({ restoName: restoNames[2].restoName })
        .lean();
      let resto4 = await commentModel
        .find({ restoName: restoNames[3].restoName })
        .lean();
      let resto5 = await commentModel
        .find({ restoName: restoNames[4].restoName })
        .lean();

      // console.log(`${restoNames[0].restoName}: ${resto1.length}`);
      // console.log(`${restoNames[1].restoName}: ${resto2.length}`);
      // console.log(`${restoNames[2].restoName}: ${resto3.length}`);
      // console.log(`${restoNames[3].restoName}: ${resto4.length}`);
      // console.log(`${restoNames[4].restoName}: ${resto5.length}`);

      //fetching the current restaurant
      let currentComment = {};
      switch (i) {
        case 0:
          currentComment = resto1;
          break;
        case 1:
          currentComment = resto2;
          break;
        case 2:
          currentComment = resto3;
          break;
        case 3:
          currentComment = resto4;
          break;
        case 4:
          currentComment = resto5;
          break;
      }

      //making the stars for the homepage
      for (let i = 0; i < currentComment.length; i++) {
        let ratingCountArray = [];
        currentComment[i].content = cutShort(currentComment[i].content);
        for (let j = 0; j < currentComment[i]["overall-rating"]; j++) {
          ratingCountArray.push(j);
        }
        currentComment[i]["ratingCount"] = ratingCountArray;
      }

      if (currentComment == null) {
        currentComment = null;
      }

      console.log(`Restaurant: ${restoNames[i].restoName}`);

      res.send({
        index: i,
        url: images[i].restoPic,
        title: images[i].restoName,
        commentData: currentComment,
      });
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).send("Error fetching images");
    }
  });

  app.get("/restaurants", async (req, res) => {
    try {
      const { stars, query } = req.query;
      let filter = {};

      // Handle search queries
      if (query) {
        filter.restoName = { $regex: new RegExp(query, "i") }; // Case-insensitive search
      }

      // Handle star ratings
      if (stars) {
        const starsArray = Array.isArray(stars)
          ? stars.map(Number)
          : [Number(stars)];
        filter.main_rating = { $in: starsArray };
      }

      const restaurants = await getData("restaurants", filter);
      const restaurant_row1 = restaurants.slice(0, 3);
      const restaurant_row2 = restaurants.slice(3, 6);
      const restaurant_row3 = restaurants.slice(6);

      // Render the response based on AJAX request or full page render
      if (req.headers["x-requested-with"] === "XMLHttpRequest") {
        res.render("partials/establishments", {
          layout: false,
          restaurant_row1,
          restaurant_row2,
          restaurant_row3,
          loginData: loginInfo,
        });
      } else {
        res.render("view-establishment", {
          layout: "index",
          title: "View Establishments",
          restaurant_row1,
          restaurant_row2,
          restaurant_row3,
          loginData: loginInfo,
        });
      }
    } catch (error) {
      console.error("Error fetching establishments:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Route to create a new user
  app.post(
    "/create-user",
    [
      check("email1").isEmail(),
      check("sign2").isLength({ min: 5, max: 15 }),
      check("pass1").notEmpty(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).send("Try Again");
        }

        const client = await MongoClient.connect(uri);
        const dbo = client.db("eggyDB");
        const collName = dbo.collection("users");

        const users = await userModel.find({}, "username email").lean();

        const email_ = String(req.body.email1);
        const username_ = String(req.body.sign2);

        //checks for duplicate
        for (let i = 0; i < users.length; i++) {
          if (
            (users[i].email === email_ && users[i].username === username_) ||
            users[i].email === email_ ||
            users[i].username === username_
          ) {
            return res.status(400).send("Duplicate Entry. Try Again.");
          }
          if (req.body.pass1 != req.body.firstpass) {
            return res.status(400).send("Password does not match");
          }
        }

        let encrypted_pass = "";

        bcrypt.hash(req.body.pass1, saltRounds, async function (err, hash) {
          encrypted_pass = hash;
          console.log("Encrypted Password: " + encrypted_pass);

          const userInfo = {
            email: req.body.email1,
            username: req.body.sign2,
            password: encrypted_pass,
            avatar_img: "./images/profile-pic.png",
            description: "",
            __v: 0,
          };

          console.log(userInfo);

          await collName.insertOne(userInfo);
          res.redirect(`/`);
        });
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send("Internal Server Error");
      }
    }
  );

  // Route to login user
  app.post("/read-user", async (req, res) => {
    try {
      const client = await MongoClient.connect(uri);
      const dbo = client.db("eggyDB");
      const collName = dbo.collection("users");

      const searchQuery = {
        username: req.body.userlogin,
        password: req.body.passlogin,
      };

      let current_hashed_password = "";

      const username = await userModel
        .findOne({ username: req.body.userlogin })
        .lean();

      bcrypt.hash(req.body.passlogin, saltRounds, async function (err, hash) {
        current_hashed_password = hash;

        const userInfo = await userModel
          .findOne({
            username: req.body.userlogin,
          })
          .lean();

        console.log(userInfo);

        if (userInfo) {
          loginInfo = {
            username: req.body.userlogin,
            password: req.body.passlogin,
            avatar_img: userInfo.avatar_img,
          };
          res.redirect("/");
        } else {
          loginInfo = null;
          res.redirect("/");
        }
      });
    } catch (error) {
      console.error("Error reading user:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Route to logout user
  app.post("/logout-user", (req, res) => {
    loginInfo = null;
    loadServer(req, res, null);
  });

  const createArray = (N) => {
    return [...Array(N).keys()].map((i) => i + 1);
  };

  app.get("/userProfile", async (req, res) => {
    try {
      const username = loginInfo.username;
      // Fetch data for comments, users, and restaurants concurrently
      const [comments, users, restaurants] = await Promise.all([
        getData("comments", { name: username }), // Filter comments by name
        getData("users", { username: username }), // Filter users by username
        getData("restaurants", {}), // Fetch all restaurants
      ]);

      const createArrays = (comment) => {
        comment["food-stars"] = createArray(comment["food-rating"]);
        comment["service-stars"] = createArray(comment["service-rating"]);
        comment["ambiance-stars"] = createArray(comment["ambiance-rating"]);
        comment["overall-stars"] = createArray(comment["overall-rating"]);
      };

      const createRestaurantArrays = (restaurant) => {
        restaurant["rating-stars"] = createArray(restaurant["main_rating"]);
      };

      comments.forEach(createArrays);
      restaurants.forEach(createRestaurantArrays);
      console.log("These are the users");
      console.log(users);
      console.log("Data fetched successfully");

      // Render user profile page with data
      res.render("user-profile", {
        layout: "user-layout",
        title: "User Profile",
        commentData: comments,
        userData: [users[0]], // Assuming users variable is defined somewhere
        restoData: restaurants,
        loginData: loginInfo,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    }
  });

  app.post("/update-comment", function (req, resp) {
    console.log("RECEIVED", req.body);

    // Parse the received ratings data
    const ratingsData = req.body;

    // Initialize objects to store ratings for each category
    const foodRatings = {};
    const serviceRatings = {};
    const ambianceRatings = {};
    const overallRatings = {};

    // Iterate over the keys of ratingsData
    for (const key in ratingsData) {
      // Check the category of the rating based on the key prefix
      if (key.startsWith("food-")) {
        const id = key.slice(5); // Remove the 'food-' prefix to get the id
        foodRatings[id] = ratingsData[key];
      } else if (key.startsWith("service-")) {
        const id = key.slice(8); // Remove the 'service-' prefix to get the id
        serviceRatings[id] = ratingsData[key];
      } else if (key.startsWith("ambiance-")) {
        const id = key.slice(9); // Remove the 'ambiance-' prefix to get the id
        ambianceRatings[id] = ratingsData[key];
      } else if (key.startsWith("overall-")) {
        const id = key.slice(8); // Remove the 'overall-' prefix to get the id
        overallRatings[id] = ratingsData[key];
      }
    }

    // Extract document ID, title, and description
    const { id, title, desc } = req.body;

    // Update the document in the database
    commentModel
      .findById(id)
      .then(function (updateResult) {
        if (!updateResult) {
          console.log("No matching document found." + id);
          return resp.status(404).send("No matching document found" + id);
        }

        console.log(updateResult);
        updateResult.title = title;
        updateResult.content = desc;
        updateResult["food-rating"] = foodRatings[0];
        updateResult["service-rating"] = serviceRatings[0];
        updateResult["ambiance-rating"] = ambianceRatings[0];
        updateResult["overall-rating"] = overallRatings[0];

        // Save the updated document
        updateResult
          .save()
          .then(function (updateSaved) {
            if (updateSaved) {
              console.log("Update successful");
              // Send the updated comment data as JSON response
              resp.json(updateResult);
            } else {
              console.log("Update failed");
              resp.status(500).send("Update failed");
            }
          })
          .catch(function (error) {
            console.error("Error saving update:", error);
            resp.status(500).send("Error saving update");
          });
      })
      .catch(function (error) {
        console.error("Error finding document:", error);
        resp.status(500).send("Error finding document");
      });
  });

  app.get("/chimmy", function (req, resp) {
    // Connect to MongoDB
    MongoClient.connect(uri)
      .then((client) => {
        console.log("Connected to MongoDB");
        const dbo = client.db("eggyDB"); // Get the database object
        const collName = dbo.collection("comments"); // Get the collection
        const cursor = collName.find({}); // Find all documents in the collection

        const col2ndName = dbo.collection("restaurants");
        const cursor2nd = col2ndName.find({});

        Promise.all([cursor.toArray(), cursor2nd.toArray()])
          .then(function ([comments, restaurants]) {
            const createArrays = (comment) => {
              comment["food-stars"] = createArray(comment["food-rating"]);
              comment["service-stars"] = createArray(comment["service-rating"]);
              comment["ambiance-stars"] = createArray(
                comment["ambiance-rating"]
              );
              comment["overall-stars"] = createArray(comment["overall-rating"]);
            };
            const createRestaurantArrays = (restaurant) => {
              restaurant["rating-stars"] = createArray(
                restaurant["main_rating"]
              );
            };

            comments.forEach(createArrays);
            restaurants.forEach(createRestaurantArrays);
            console.log(comments[0]);
            console.log(restaurants);
            console.log("Length Here");
            console.log(restaurants.length);
            console.log("Data fetched successfully");

            // Split the displayRestos array into two arrays
            resp.render("estb-review", {
              layout: "estb-review-layout",
              title: "Review",
              commentData: comments,
              restoData: [restaurants[0]],
            });
          })
          .catch(function (error) {
            console.error("Error fetching data:", error);
            resp.status(500).send("Error fetching data");
          })
          .finally(() => {
            client.close(); // Close the MongoDB client after fetching data
          });
      })
      .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
        resp.status(500).send("Error connecting to MongoDB");
      });
  });

  // const upload = multer({ storage });
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Construct the path to the public/images directory relative to this script
      const uploadsDir = path.join(__dirname, "..", "..", "public", "images");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // Generate a unique filename for the uploaded file
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });

  const upload = multer({ storage });

  app.post("/update-profile", upload.single("img"), async (req, res) => {
    const { username: newUsername, email, password, description } = req.body;
    // const avatarImgPath = req.file ? path.join('/images', req.file.filename) : undefined;
    // const avatarImgPath = req.file ? `/images/${req.file.filename}` : undefined;
    // Inside your /update-profile route
    const avatarImgPath = req.file ? `/images/${req.file.filename}` : undefined;

    const currentUsername = loginInfo.username;

    try {
      const user = await User.findOne({ username: currentUsername });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Dynamically create an update object
      let updateData = {};
      if (newUsername) updateData.username = newUsername;
      if (email) updateData.email = email;

      // Only hash the password if it's provided
      if (password) {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        updateData.password = hashedPassword;
      }

      if (avatarImgPath) updateData.avatar_img = avatarImgPath;
      if (description) updateData.description = description;

      // Perform the update only if updateData is not empty
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
          new: true,
        });
        if (updatedUser) {
          // Optionally update loginInfo if the username changes
          if (newUsername) loginInfo.username = newUsername;
          res.json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
          });
        } else {
          res.status(404).json({ success: false, message: "Update failed" });
        }
      } else {
        res.json({ success: false, message: "No update information provided" });
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      res
        .status(500)
        .json({ success: false, message: "Error updating profile" });
    }
  });

  app.post("/delete-account", async (req, res) => {
    if (!loginInfo) {
      // This condition checks if there's a user logged in
      return res
        .status(403)
        .json({ success: false, message: "No user logged in." });
    }

    const currentUsername = loginInfo.username; // Get the username of the logged-in user

    try {
      const result = await User.deleteOne({ username: currentUsername });
      if (result.deletedCount === 0) {
        return res.json({
          success: false,
          message: "Failed to delete account.",
        });
      }

      // Clear the loginInfo as the account has been successfully deleted
      loginInfo = null;

      // Since this route handles AJAX requests, we can't directly use res.redirect here
      // Instead, we send a response indicating success and handle the redirection on the client side
      res.json({
        success: true,
        message: "Account deleted successfully.",
        redirectTo: "/",
      });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res
        .status(500)
        .json({ success: false, message: "Error deleting account" });
    }
  });

  app.post('/action', function(req, resp){
    console.log(req.body.player)
    console.log(req.body.cell)

    let action = new actionModel({
        player: req.body.player,
        location: req.body.cell  
    })

    //action.save().then(() =>console.log("successfully added to database"))
    actions.push(action)

    resp.send({
        images : images
    })
    resp.render('main',{
        layout: 'index', 
        title: 'My Game page'
    })

});

  app.get("/update-like-count", async (req, resp) => {
    try {
      await commentModel.updateOne({}, { $set: { numLike: numLike } });
      console.log(">>>>>>>>>>Ilan " + numLike);
  
      resp.send({
            numLike : numLike,
      })
    } catch (error) {
      console.error("Error updating like count:", error);
      res.status(500).send("Error updating like count");
    }
  });
}