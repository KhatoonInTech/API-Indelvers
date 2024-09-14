const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const { Authorization } = require("./authHelper");
require("dotenv").config();

const port = 4000;
process.env.NODE_NO_WARNINGS = 1;

const app = express();

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  });
  
  const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
      if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported file type"), false);
      }
    }
  }).single('media'); // Change this line
  
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/linkedin/authorize', (req, res) => {
  return res.redirect(Authorization());
});

app.get('/api/linkedin/redirect', async (req, res) => {
    const {code}= req.query;
    console.log(`code:${code}`);
    const accessToken = process.env.ACCESS_TOKEN;
  try {
    const userInfo = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    const userID =userInfo.data.sub;
    process.env.LINKEDIN_USER_ID = userID;
    // console.log(`userID =${userID}`);

    console.log('User Information:', userInfo.data);
    res.render('success', { userInfo: userInfo.data });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).send('Error fetching user info');
  }
});

// Render the upload form
app.get('/linkedin/upload', (req, res) => {
    res.render('upload');
  });

// Uploading on LinkedIn

app.post('/linkedin/upload', (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: 'Multer error', error: err });
    } else if (err) {
      return res.status(500).json({ message: 'Unknown error', error: err });
    }
  const accessToken = process.env.ACCESS_TOKEN;
  const userId = process.env.LINKEDIN_USER_ID;
  const { text, category } = req.body;

  console.log('Request body:', req.body);
  console.log('File:', req.file);

  if (!text || !category) {
    return res.status(400).json({ message: 'Text content and category are required' });
  }

  if (!accessToken || !userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    let mediaCategory = 'NONE';
    let recipe='None';
    let media = req.file;

    if (category === 'image' && media && media.mimetype.startsWith('image/')) {
      mediaCategory = 'IMAGE';
      recipe ="urn:li:digitalmediaRecipe:feedshare-image";
    } 
    else if (category === 'video' && media && media.mimetype.startsWith('video/')) {
      mediaCategory = 'VIDEO';
      recipe ="urn:li:digitalmediaRecipe:feedshare-video";
    }
    // else if (category === 'pdf' && media && media.mimetype === 'application/pdf') {
    //   mediaCategory = 'DOCUMENT';
    // }

    console.log('Media category:', mediaCategory);
    console.log('Media file:', media);

    let postData = {
      author: `urn:li:person:${userId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    let assetId;

    if (media) {
      try {
        // Step 1: Register upload
        const registerUploadUrl = 'https://api.linkedin.com/v2/assets?action=registerUpload';
        const registerUploadResponse = await axios.post(registerUploadUrl, {
          registerUploadRequest: {
            recipes: [
              recipe
            ],
            owner: `urn:li:person:${userId}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json'
          }
        });

        console.log('Register upload response:', registerUploadResponse.data);

        const uploadUrl = registerUploadResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
        assetId = registerUploadResponse.data.value.asset;

        console.log('Upload URL:', uploadUrl);
        console.log('Asset ID:', assetId);

        // Step 2: Upload the file
        const fileContent = fs.readFileSync(media.path);
        const fileUploadResponse = await axios.put(uploadUrl, fileContent, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': media.mimetype
          }
        });

        console.log('File upload response:', fileUploadResponse.status, fileUploadResponse.statusText);

        // Step 3: Add media to the post data
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          description: {
            text: 'Media uploaded by user'
          },
          media: assetId,
          title: {
            text: media.originalname
          }
        }];
        postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = mediaCategory;

        console.log('Updated post data:', JSON.stringify(postData, null, 2));
      } catch (mediaError) {
        console.error('Error during media upload:', mediaError.response ? mediaError.response.data : mediaError.message);
        return res.status(500).json({ message: 'Error uploading media', error: mediaError.response ? mediaError.response.data : mediaError.message });
      }
    }

    // Step 4: Create the post
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Post created:', response.data);
    res.status(200).json({ message: 'Post created successfully', data: response.data });

    // Clean up uploaded files
    if (media) {
      fs.unlink(media.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
  } catch (error) {
    console.error('Error creating post:', error.response ? error.response.data : error.message);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    res.status(500).json({ message: 'Error creating post', error: error.response ? error.response.data : error.message });
  }
});
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});