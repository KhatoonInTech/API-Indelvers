const fs = require("fs");
const express = require("express");
const multer = require("multer");
const OAuth2Data = require("./credentials.json");
var title, description;
var tags = [];

const { google } = require("googleapis");

const app = express();

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);
var authed = false;

// If modifying these scopes, delete token.json.
const SCOPES =
  "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile";

app.set("view engine", "ejs");

var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./videos");
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: Storage,
}).single("file"); // Field name and max count

app.get("/", (req, res) => {
  if (!authed) {
    // Generate an OAuth URL and redirect there
    var url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log(url);
    res.render("index", { url: url });
  } else {
    var oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: "v2",
    });
    oauth2.userinfo.get(function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response.data);
        name = response.data.name;
        pic = response.data.picture;
        res.render("success", {
          name: response.data.name,
          pic: response.data.picture,
          success: false,
        });
      }
    });
  }
});

app.post("/upload", (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).send("Something went wrong during the upload.");
    } else {
      console.log(req.file.path);
      title = req.body.title;
      description = req.body.description;
      tags = req.body.tags;
      let privacyChoice = req.body.privacyChoice;

      // Validate user input
      if (privacyChoice !== 'private' && privacyChoice !== 'public') {
        console.error('Invalid privacy choice');
        return res.status(400).send('Invalid privacy choice');
      }

      console.log(title);
      console.log(description);
      console.log(tags);

      const youtube = google.youtube({ version: "v3", auth: oAuth2Client });

      const uploadVideo = async (retryCount = 0) => {
        try {
          const data = await youtube.videos.insert({
            resource: {
              snippet: {
                title: title,
                description: description,
                tags: tags,
              },
              status: {
                privacyStatus: privacyChoice,
              },
            },
            part: "snippet,status",
            media: {
              body: fs.createReadStream(req.file.path),
            },
          });
          console.log("Video upload successful:", data);
          fs.unlinkSync(req.file.path);
          res.render("success", { name: name, pic: pic, success: true });
        } catch (err) {
          if (err.code === 'ECONNRESET' && retryCount < 3) {
            console.warn(`Retrying upload (${retryCount + 1}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay
            return uploadVideo(retryCount + 1);
          } else {
            console.error("YouTube API error:", err);
            return res.status(500).send("Error uploading video to YouTube.");
          }
        }
      };

      await uploadVideo();
    }
  });
});


app.get("/logout", (req, res) => {
  authed = false;
  res.redirect("/");
});

app.get("/google/callback", function (req, res) {
  const code = req.query.code;
  if (code) {
    // Get an access token based on our OAuth code
    oAuth2Client.getToken(code, function (err, tokens) {
      if (err) {
        console.log("Error authenticating");
        console.log(err);
      } else {
        console.log("Successfully authenticated");
        console.log(tokens);
        oAuth2Client.setCredentials(tokens);

        authed = true;
        res.redirect("/");
      }
    });
  }
});

app.listen(5000, () => {
  console.log("Go to : http://localhost:5000 ");
});
