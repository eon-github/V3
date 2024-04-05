const express = require("express");
const { MongoClient } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017/eggyDB";

const bcrypt = require("bcrypt");
const saltRounds = 10;

async function connectToDB() {
  try {
    const client = await MongoClient.connect(uri);
    return client.db('eggyDB');
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
        const dbo = client.db('eggyDB');
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
      const dbo = client.db('eggyDB');
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
            username: req.body.userlogin
          })
          .lean();

          console.log(userInfo);

        if (userInfo) {
          loginInfo = {
            username: req.body.userlogin,
            password: req.body.passlogin,
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
      loginData: loginInfo
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});



app.post('/update-comment', function (req, resp) {
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
      if (key.startsWith('food-')) {
          const id = key.slice(5); // Remove the 'food-' prefix to get the id
          foodRatings[id] = ratingsData[key];
      } else if (key.startsWith('service-')) {
          const id = key.slice(8); // Remove the 'service-' prefix to get the id
          serviceRatings[id] = ratingsData[key];
      } else if (key.startsWith('ambiance-')) {
          const id = key.slice(9); // Remove the 'ambiance-' prefix to get the id
          ambianceRatings[id] = ratingsData[key];
      } else if (key.startsWith('overall-')) {
          const id = key.slice(8); // Remove the 'overall-' prefix to get the id
          overallRatings[id] = ratingsData[key];
      }
  }

  // Extract document ID, title, and description
  const { id, title, desc } = req.body;
  const currDate = new Date().toLocaleDateString();

  // Update the document in the database
  commentModel.findById(id).then(function (updateResult) {
      if (!updateResult) {
          console.log("No matching document found." + id);
          return resp.status(404).send("No matching document found" + id);
      }

      console.log(updateResult);
      updateResult.title = title;
      updateResult.content = desc;
      updateResult['food-rating'] = foodRatings[0];
      updateResult['service-rating'] = serviceRatings[0];
      updateResult['ambiance-rating'] = ambianceRatings[0];
      updateResult['overall-rating'] = overallRatings[0];
      updateResult.date = currDate;
      updateResult.isEdited = 1;

      // Save the updated document
      updateResult.save().then(function (updateSaved) {
          if (updateSaved) {
              console.log("Update successful");
              // Send the updated comment data as JSON response
              resp.json(updateResult);
          } else {
              console.log("Update failed");
              resp.status(500).send("Update failed");
          }
      }).catch(function (error) {
          console.error("Error saving update:", error);
          resp.status(500).send("Error saving update");
      });
  }).catch(function (error) {
      console.error("Error finding document:", error);
      resp.status(500).send("Error finding document");
  });
});



app.delete('/delete-comment', function(req, res) {
  const commentId = req.body.deleteId; // Make sure this matches the name attribute of your form input
  console.log(commentId);

  commentModel.findByIdAndDelete(commentId)
      .then(deletedDocument => {
          if (deletedDocument) {
              console.log('Comment deleted successfully:', deletedDocument);
              // Send a success response back to the client
              res.status(200).json({ message: 'Comment deleted successfully' });
          } else {
              console.log('Document not found.');
              // Send a response indicating that the document was not found
              res.status(404).json({ message: 'Document not found' });
          }
      })
      .catch(error => {
          console.error('Error deleting document:', error);
          // Send a response indicating that an error occurred
          res.status(500).json({ message: 'Error deleting document', error });
      });
});

 







// Middleware to fetch restaurant and comments data
async function getRestaurantData(req, res, next) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbo = client.db('eggyDB');

    const commentsCollection = dbo.collection("comments");
    const restaurantsCollection = dbo.collection("restaurants");

    // Fetch all comments and restaurants, and store in res.locals
    res.locals.comments = await commentsCollection.find({}).toArray();
    res.locals.restaurants = await restaurantsCollection.find({}).toArray();

    // Process comments
    res.locals.comments.forEach(comment => {
      comment["food-stars"] = createArray(comment["food-rating"]);
      comment["service-stars"] = createArray(comment["service-rating"]);
      comment["ambiance-stars"] = createArray(comment["ambiance-rating"]);
      comment["overall-stars"] = createArray(comment["overall-rating"]);
    });

    // Process restaurants
    res.locals.restaurants.forEach(restaurant => {
      restaurant["rating-stars"] = createArray(restaurant["main_rating"]);
    });

    next(); // Proceed to the route handler
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  } finally {
    await client.close();
  }
}

// Route handler for restaurant page
app.get("/:restaurantLink", getRestaurantData, async (req, resp) => {
  const restaurantLink = req.params.restaurantLink;
  const { comments, restaurants } = resp.locals;

  // Find the restaurant data based on the restaurant link
  const restaurantData = restaurants.find(r => r.restoLink === restaurantLink);

  if (restaurantData) {
    // Filter comments based on the restaurant name
    const commentsForRestaurant = comments.filter(comment => comment.restoName === restaurantData.restoName);

    // Render the page with the restaurant data and filtered comments
    resp.render("estb-review", {
      layout: "estb-review-layout",
      title: restaurantData.restoName,
      commentData: commentsForRestaurant, // Use filtered comments from res.locals
      restoData: [restaurantData], // Wrap the restaurant data in an array to keep the structure consistent
      loginData: loginInfo
    });
  } else {
    // No match was found, handle the error (e.g., render a 404 page)
    // resp.status(404).render("not-found-page");
  }
});

app.post('/get-user-info', (req, res) => {
    console.log("loginInfo", loginInfo.username)
  res.json({
      username: loginInfo.username
  });

  console.log("loginInfo", loginInfo.username)
});





function errorFn(err){
  console.log('Error fond. Please trace!');
  console.error(err);
}





};
