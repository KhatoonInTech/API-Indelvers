<div align="center">
  <h1> YouTube Integration with Node.js and Express.js</h1>
  <a class="header-badge" target="_blank" href="https://www.linkedin.com/in/khatoonintech/">
  <img src="https://img.shields.io/badge/style--5eba00.svg?label=LinkedIn&logo=linkedin&style=social">
  </a>
  

<sub>Author:
<a href="https://www.linkedin.com/in/Khatoonintech/" target="_blank">Ayesha Noreen</a><br>
<small> SWE Fellow @Confiniti Labs </small>
</sub>

---

![LinkedIn](../images/logo-yt.png)

</div>

---
# **YouTube Video Uploader via OAuth 2.0**  

This project allows authenticated YouTube video uploads using Google OAuth 2.0. It provides a web interface for users to log in via Google, manage authentication, and upload videos with custom titles, descriptions, tags, and privacy settings.

## **Project Structure**
```bash
.
├── app.js           # Main server file handling routes and logic
├── views
│   ├── index.ejs    # Frontend - login page
│   ├── success.ejs  # Frontend - YouTube upload form
├── credentials.json # OAuth 2.0 credentials
├── public
│   ├── css          # CSS files
│   └── js           # JavaScript files (e.g., for TagsInput)
└── uploads          # Stores uploaded files temporarily
```

## **Key Features**

### **1. OAuth 2.0 Authentication**
- **OAuth 2.0** flow is managed through Google APIs.
- User logs in via Google, granting permission to upload videos to their YouTube channel.
- After successful login, the server retrieves an access token, which is used to make authorized requests.

### **2. Google OAuth Credentials**
`credentials.json` stores client credentials necessary for OAuth.
```json
{
  "web": {
    "client_id": "YOUR_CLIENT_ID",
    "project_id": "YOUR_PROJECT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:5000/google/callback/"],
    "javascript_origins": ["http://localhost:5000"]
  }
}
```

### **3. Routes (`app.js`)**

- **`/login`**  
  Initiates OAuth 2.0 login, redirecting to Google for authentication.

- **`/google/callback`**  
  Handles OAuth 2.0 callback. Exchanges authorization code for tokens (access + refresh).

- **`/upload`**  
  Handles video upload. Receives form data, including title, description, tags, and privacy status. The video file is handled using `multer` middleware.

### **4. Video Upload Process**
Once authenticated, users can upload videos through the form in `success.ejs`.

```javascript
app.post('/upload', upload.single('file'), async (req, res) => {
    const { title, description, tags, privacyChoice } = req.body;
    const videoPath = req.file.path;

    try {
        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: { title, description, tags: tags.split(',') },
                status: { privacyStatus: privacyChoice }
            },
            media: { body: fs.createReadStream(videoPath) }
        });
        res.render('success', { success: true });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Error uploading video');
    }
});
```

### **5. Video Metadata**
The form allows users to provide metadata for their videos, which is sent to YouTube during upload:
- **Title**: Required video title.
- **Description**: Optional description of the video.
- **Tags**: Comma-separated tags, managed using a `TagsInput` plugin.
- **Privacy Status**: Choose between public or private visibility.

### **6. Middleware**
- **`body-parser`**: Parses form data.
- **`multer`**: Handles file uploads, storing videos temporarily in the `uploads` directory.
- **`google-auth-library`** and **`googleapis`**: Handle OAuth 2.0 authentication and YouTube API requests.

### **7. Tags Input Plugin**
The **TagsInput** plugin enhances the video tags field in the form, allowing users to add multiple tags separated by commas.

```html
<input id="tags-input" type="text" class="form-control" name="tags" data-role="tagsinput" placeholder="Enter tags">
```

### **8. Frontend Pages**

- **`index.ejs`**  
  The landing page where users click to initiate Google OAuth login.

- **`success.ejs`**  
  Displays the authenticated user's YouTube profile and a form to upload videos with metadata.

### **9. Detailed Flow**

1. **Login via Google**:  
   User clicks on the login button, initiating OAuth 2.0 flow. After successful login, the server retrieves access tokens and redirects the user to `success.ejs`.

2. **Form Submission**:  
   Users submit the video upload form, including video title, description, tags, privacy settings, and the video file itself.

3. **File Handling & Upload**:  
   The file is stored locally using `multer` and then streamed to YouTube using `youtube.videos.insert()`.

4. **Response Handling**:  
   The server sends success/failure feedback to the user after the video upload completes.

## **Installation and Setup**
1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd project_folder
   ```

2. **Install dependencies**:
   ```bash
   npm install express googleapis google-auth-library body-parser multer ejs
   ```

3. **Set up Google OAuth credentials**:  
   Update `credentials.json` with your `client_id`, `client_secret`, and other fields from the Google API Console.

4. **Run the app**:
   ```bash
   node app.js
   ```
   Access the app at `http://localhost:5000/`.

## **Dependencies**
- **Express**: Backend framework for Node.js.
- **Google APIs**: For YouTube API integration.
- **Multer**: Handles file uploads.
- **Body-parser**: Parses incoming form data.
- **EJS**: Template engine for rendering dynamic content.

---

<div align="center">
<h3>For any query/help ,please contact our developer:</h3>  
Developer : <a href="https://www.linkedin.com/in/Khatoonintech/" target="_blank">Ayesha Noreen</a><br>
	<small> SWE Fellow @Confiniti Labs </small>
<br> <a href="https://www.github.com/Khatoonintech/" target="_blank"> Don't forget to ⭐ our repo </a><br>


</div>
