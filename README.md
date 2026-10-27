# Instagram Direct Messages Chat

A single-page chat application with login, real-time messaging, image uploads, and emoji support.

## Features

- **Login**: Two users (Youssef / Love) with password authentication
- **Real-time Chat**: Live message sync using Supabase Realtime
- **Image Upload**: Upload images to Supabase Storage
- **Emoji Picker**: Quick emoji insertion
- **RTL Support**: Full Arabic/English bidirectional text support
- **Instagram UI**: Clean, mobile-friendly design

## Setup

### 1. Supabase Configuration

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Create the `messages` table with these columns:
   - `id` (UUID, Primary Key)
   - `sender_id` (Text)
   - `sender_name` (Text)
   - `content` (Text, nullable)
   - `image_url` (Text, nullable)
   - `created_at` (Timestamp, default: now())

4. Enable Realtime for the `messages` table:
   - Go to the table settings
   - Toggle "Realtime" ON

5. Create a Storage bucket named `chat-images`:
   - Go to Storage → New Bucket
   - Name: `chat-images`
   - Make it Public

6. Update `config.js` with your Supabase credentials:
   - Copy your **Project URL** to `SUPABASE_URL`
   - Copy your **Publishable Anon Key** to `SUPABASE_KEY`

### 2. Run Locally

**Option A: Live Server (VS Code)**
- Install the "Live Server" extension
- Right-click `index.html` → "Open with Live Server"
- Opens at `http://127.0.0.1:5500`

**Option B: Netlify Drop**
- Drag & drop the project folder onto [drop.netlify.com](https://drop.netlify.com)
- Get a live URL instantly

**Option C: Python SimpleHTTPServer**
```bash
cd project-folder
python3 -m http.server 8000
# Open http://localhost:8000