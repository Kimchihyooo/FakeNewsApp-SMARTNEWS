# CredibilityScan Frontend

This directory contains the static frontend assets for the CredibilityScan application. It is built with vanilla HTML, CSS, and JavaScript.

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   ├── detector.html
│   ├── about.html
│   ├── css/
│   ├── font/
│   ├── homepagepics/
│   ├── howtousepics/
│   ├── js/
│   ├── results/
│   └── ... (other static assets)
└── README.md
```

## Running Locally

To run the frontend application locally, simply open the `public/index.html` file in your web browser. There is no build step required.

```bash
# From the frontend directory
start public/index.html 
# Or just open it directly in your browser
```

## Deployment

This frontend is designed for deployment on a static hosting service such as Vercel or Netlify.

### Vercel

1.  **Sign up/Log in:** Create an account or log in to [Vercel](https://vercel.com/).
2.  **Import Project:** Link your GitHub repository (this `frontend` repository).
3.  **Configure:** When prompted for project settings, ensure the "Root Directory" is set to `public/`.
4.  **Deploy:** Vercel will automatically detect and deploy your static site.

### Netlify

1.  **Sign up/Log in:** Create an account or log in to [Netlify](https://www.netlify.com/).
2.  **Import Project:** Link your GitHub repository (this `frontend` repository).
3.  **Configure Build Settings:**
    *   **Base directory:** Leave empty (or `/`)
    *   **Build command:** Leave empty (or `echo "No build command needed"`)
    *   **Publish directory:** Set this to `public/`
4.  **Deploy:** Netlify will deploy the contents of your `public` folder.
