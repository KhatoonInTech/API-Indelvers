<div align="center">
  <h1> LinkedIn Integration with Node.js and Express.js</h1>
  <a class="header-badge" target="_blank" href="https://www.linkedin.com/in/khatoonintech/">
  <img src="https://img.shields.io/badge/style--5eba00.svg?label=LinkedIn&logo=linkedin&style=social">
  </a>
  

<sub>Author:
<a href="https://www.linkedin.com/in/Khatoonintech/" target="_blank">Ayesha Noreen</a><br>
<small> SWE Fellow @Confiniti Labs </small>
</sub>
![LinkedIn](../images/logo-hero.png)

</div>

---

This project demonstrates how to integrate LinkedIn authentication and API features into a Node.js/Express.js application. The application allows users to authenticate via LinkedIn, upload media files (images, videos, PDFs), and post content on their LinkedIn profile through LinkedIn's API.

## Project Structure

```
|-app.js
|-authHelper.js
|-.env
|-package-lock.json
|-package.json
|-views
    |-index.ejs
    |-success.ejs
    |-upload.ejs
    |-style.css
    |-script.js
```

### Overview

- **app.js**: Main server file handling routes, authentication, LinkedIn API calls, and file uploads.
- **authHelper.js**: Helper module for generating LinkedIn OAuth authorization URL.
- **.env**: Environment variables for sensitive data (LinkedIn Client ID, Redirect URI, etc.).
- **package.json**: Project metadata and dependencies.
- **views/**: Contains front-end `.ejs` templates for rendering the web pages.
    - **index.ejs**: Landing page for LinkedIn authorization.
    - **success.ejs**: Page displayed after successful LinkedIn authentication.
    - **upload.ejs**: Page to upload media files and post to LinkedIn.

---

## Dependencies

The project uses several packages to simplify LinkedIn API integration and file handling:

- **express**: Node.js web framework.
- **body-parser**: Parses incoming request bodies.
- **axios**: Makes HTTP requests to LinkedIn's API.
- **multer**: Middleware for handling multipart/form-data, used for file uploads.
- **dotenv**: Loads environment variables from a `.env` file.

Install the dependencies via:

```bash
npm install express body-parser axios multer dotenv
```

---

## Environment Variables

The `.env` file stores environment-sensitive data. These are required for OAuth authentication and API interaction.

Example of `.env`:

```plaintext
CLIENT_ID=your-linkedin-client-id
CLIENT_SECRET=your-linkedin-client-secret
REDIRECT_URI=http://localhost:4000/api/linkedin/redirect
ACCESS_TOKEN=your-linkedin-access-token
SCOPE=r_liteprofile r_emailaddress w_member_social
```

---

## Route Definitions

### `/`
- **Method**: `GET`
- **Description**: Renders the landing page (`index.ejs`) with a button to initiate LinkedIn authorization.

### `/api/linkedin/authorize`
- **Method**: `GET`
- **Description**: Redirects to LinkedIn's OAuth authorization page by generating the URL using the `Authorization()` function from `authHelper.js`.
- **Logic**: 
  - Uses LinkedIn OAuth 2.0 to request authorization.
  - Redirects to LinkedIn’s API endpoint with the necessary client ID, scopes, and redirect URI.

### `/api/linkedin/redirect`
- **Method**: `GET`
- **Description**: Handles LinkedIn's redirect after user authorization.
- **Logic**:
  - Extracts the `code` from the query parameters.
  - Uses the provided access token (stored in `.env`) to fetch user information from LinkedIn.
  - Renders the `success.ejs` template, displaying user information.

### `/linkedin/upload`
- **Method**: `GET`
- **Description**: Renders the `upload.ejs` page that allows the user to upload media (image or video) and post content to LinkedIn.

### `/linkedin/upload`
- **Method**: `POST`
- **Description**: Handles file uploads and posting content to LinkedIn.
- **Logic**:
  - Uses `multer` to process file uploads.
  - Verifies the media category (image, video).
  - Registers the media upload on LinkedIn using the LinkedIn API.
  - Posts the media or text content to LinkedIn.

---

## File Upload Handling

The project uses `multer` to handle file uploads. The configuration is in `app.js`, where the destination folder is defined as `uploads/`. Multer allows only certain file types (PDFs, images, and videos).

### Multer Configuration:

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
```

### Supported File Types

- Images (JPEG, PNG, etc.)
- Videos (MP4, MOV, etc.)
- PDFs (for potential document sharing)

---

## LinkedIn OAuth Integration

### Authorization Flow

The LinkedIn OAuth 2.0 flow is used to authenticate users. The flow consists of the following steps:

1. **Redirect to Authorization URL**: 
    - Initiated by visiting `/api/linkedin/authorize`.
    - Redirects to LinkedIn's OAuth endpoint for the user to grant access to their LinkedIn profile.

2. **Handle Redirect**: 
    - LinkedIn redirects back to `/api/linkedin/redirect` with an authorization code.
    - The application then exchanges this code for an access token.

3. **Fetch User Information**:
    - The access token is used to fetch user details via LinkedIn’s API.

### Code Example (Generating Authorization URL):

```javascript
const Authorization = () => {
  return encodeURI(`https://linkedin.com/oauth/v2/authorization?client_id=${process.env.CLIENT_ID}&response_type=code&scope=${process.env.SCOPE}&redirect_uri=${process.env.REDIRECT_URI}`);
};
```

---

## LinkedIn API Integration

### Fetching User Information

The user information is fetched from the LinkedIn API using the `GET` request to the `/v2/userinfo` endpoint:

```javascript
const userInfo = await axios.get('https://api.linkedin.com/v2/userinfo', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Restli-Protocol-Version': '2.0.0'
  }
});
```

The following user details are extracted:
- Name
- Email
- Profile Picture
- Locale

### Posting Content on LinkedIn

The application can post text and media (images, videos) on LinkedIn using the LinkedIn API. 

#### Steps:
1. **Register Upload**: The media is registered using the `/v2/assets?action=registerUpload` endpoint, which returns an upload URL.
2. **Upload File**: The media file is uploaded to the provided URL.
3. **Create Post**: The media and text are posted to LinkedIn via the `/v2/ugcPosts` endpoint.

---

## Views

The application uses EJS as the templating engine. The views are responsible for rendering the front-end pages, including user interactions and form submissions.

### index.ejs

The landing page that prompts users to link their LinkedIn account.

```html
<a href="/api/linkedin/authorize" class="btn btn-danger"><span class="fa fa-linkedin"></span> Link your LinkedIn with me</a>
```

### success.ejs

Displays the success message and user information after successful LinkedIn authorization.

```html
<p id="success-message">Thank you for authorizing your LinkedIn account. You're all set!</p>
```

### upload.ejs

Provides the interface for uploading media and posting content to LinkedIn.

```html
<form id="uploadForm" enctype="multipart/form-data">
    <input type="file" name="media">
    <textarea name="text" placeholder="Write your post..."></textarea>
    <button type="submit">Upload to LinkedIn</button>
</form>
```

---

## Error Handling

The application handles errors gracefully, providing appropriate status codes and error messages:

- **File upload errors**: Multer errors (e.g., unsupported file types) are caught and handled.
- **LinkedIn API errors**: Errors during media uploads or post creation are logged and returned as JSON responses with status codes.

### Example of Error Handling:

```javascript
if (err instanceof multer.MulterError) {
  return res.status(500).json({ message: 'Multer error', error: err });
} else if (err) {
  return res.status(500).json({ message: 'Unknown error', error: err });
}
```

---

## Conclusion

This LinkedIn Integration project demonstrates a full-stack Node.js application that integrates LinkedIn OAuth 2.0 for user authentication, media uploads, and content posting. The project is modular, scalable, and provides a foundation for integrating social media features into any Node.js application.


<sub>For any query/help ,please contact our developer:
<a href="https://www.linkedin.com/in/Khatoonintech/" target="_blank">Ayesha Noreen</a><br>
<small> SWE Fellow @Confiniti Labs </small>
</sub>
