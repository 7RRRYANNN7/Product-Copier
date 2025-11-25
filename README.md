# Product Copier - eBay & Amazon

A modern web application that allows you to extract product descriptions and images from eBay and Amazon listings by simply pasting the product URL.

## Features

- 🛒 **Multi-Platform Support**: Works with both eBay and Amazon product URLs
- 💬 **Chat-Style History**: Every submission becomes a saved “chat” named after the product for quick recall
- 🔍 **Design-Matched Search**: Dedicated search view to filter past copies with real-time results
- 📝 **Seller Description Extraction**: Pulls full product copy, including Amazon’s “Item description from the seller”
- 🖼️ **Image Gallery**: View and download images individually or via ZIP (selection downloader or download-all)
- 🎨 **Dual Themes**: Pixel-accurate light/dark modes matching the provided designs, with micro-interactions and hover animations
- 🌐 **Multi-Language**: Switch between English and Spanish across the entire interface
- ⚙️ **Settings Panel**: Display (theme/language) and account (profile picture + username) settings with instant preview

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Paste an eBay or Amazon product URL in the input field
4. Click "Extract Product" to get the description and images
5. Copy the description or download images as needed
6. Open **Settings → Display** to toggle light/dark or change languages (English/Spanish)

## GitHub Pages / static hosting

The `docs/` folder mirrors the front-end so you can enable GitHub Pages (Deploy from branch → main → `/docs`). Because GitHub Pages cannot run the Node/Express scraper, point the UI at a hosted backend:

1. Deploy `server.js` to a Node-friendly host (Render, Railway, Fly.io, etc.).
2. A hosted default (`https://product-copier.onrender.com`) is baked into `public/api-config.js` (and mirrored in `docs/api-config.js`) so the static build works immediately. Update that value if you deploy your own backend.
3. You can still override the value at runtime via **Settings → API Settings**. The saved value is persisted in `localStorage`.
4. Leave the config blank when running the bundled Express server locally; it will default to the same origin.

### Quick Render deploy

1. Create a free Render account and click **New → Web Service**.
2. Point it at this repository and keep the defaults; Render will use `render.yaml` to install dependencies and run `npm start`.
3. Once deployed, copy the Render service URL (for example, `https://product-copier.onrender.com`).
4. Set that URL in `public/api-config.js` (and therefore `docs/api-config.js`), commit, and push so the static GitHub Pages build can call the hosted backend without extra configuration.

> Tip: When you open the GitHub Pages build without a configured backend, the UI now shows a setup banner reminding you to set the API base in Settings → API Settings so scrapes don't fail on static hosts.

## Development

For development with auto-reload:
```bash
npm run dev
```

## Technologies

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Scraping**: Puppeteer

## Notes

- The application uses Puppeteer to scrape product pages from eBay and Amazon
- Images are downloaded directly from the platform's CDN
- Multiple images are automatically packaged in ZIP files named after the product title
- For Amazon products, the "Item description from the seller" section is extracted
- Language, theme, username, avatar, and saved product “chats” persist via localStorage

