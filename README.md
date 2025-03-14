# Admin Panel - Group Management

A minimalist, responsive admin panel for managing groups with Supabase integration. The application allows administrators to view, search, and select groups in a table format.

## Features

- View groups in a clean, mobile-responsive table
- Search groups by name with real-time filtering
- Select all groups with a single button
- Individual group selection via checkboxes
- Supabase integration for data persistence

## Prerequisites

- Node.js and npm installed
- Supabase account and project

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables:
   - Rename `.env` file if needed
   - Update the Supabase URL and anonymous key:
     ```
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Create a table in Supabase with the following columns:
   - `id`: integer (primary key)
   - `name`: text
   - `group_id`: integer
   - `chouse`: boolean

## Development

Run the development server:

```
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Building for Production

Build the app for production:

```
npm run build
```

## Deployment

This project is configured for easy deployment on Netlify:

1. Push your code to a GitHub repository
2. Log in to Netlify and click "New site from Git"
3. Connect to your GitHub repository
4. Use these build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
5. Add the following environment variables in Netlify:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_ANON_KEY
   - REACT_APP_WEBHOOK_URL
6. Click "Deploy site"

For manual deployment via the Netlify CLI:
```
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## Mobile Optimization

This admin panel is optimized for mobile use with:
- Responsive layout
- Touch-friendly UI elements
- Compact design that works well on smaller screens
