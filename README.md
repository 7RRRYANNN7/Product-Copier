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

