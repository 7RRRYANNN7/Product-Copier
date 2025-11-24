const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Please provide a valid URL' });
  }

  const isEbay = url.includes('ebay.com');
  const isAmazon = url.includes('amazon.com') || url.includes('amazon.co.uk') || url.includes('amazon.de') || url.includes('amazon.fr') || url.includes('amazon.es') || url.includes('amazon.it') || url.includes('amazon.ca') || url.includes('amazon.com.mx') || url.includes('amazon.in') || url.includes('amazon.jp') || url.includes('amazon.com.au');
  const isAliExpress = url.includes('aliexpress.com') || url.includes('aliexpress.us');

  if (!isEbay && !isAmazon && !isAliExpress) {
    return res.status(400).json({ error: 'Please provide a valid eBay, Amazon, or AliExpress URL' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    // Set viewport for better rendering
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate with longer timeout
    console.log('Navigating to:', url);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    // Verify page loaded
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Check if we got blocked
    const pageContent = await page.evaluate(() => document.body.innerText);
    if (pageContent.includes('captcha') || pageContent.includes('robot') || pageContent.includes('unusual traffic')) {
      throw new Error('Website is showing a captcha or blocking the request. Please try again later.');
    }
    
    // Wait for page to be interactive
    await page.waitForTimeout(5000);
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);

    let title, description, images;

    if (isAmazon) {
      // Wait for Amazon page elements
      try {
        await page.waitForSelector('#productTitle, h1, #landingImage, img', { timeout: 15000 });
      } catch (e) {
        console.log('Waiting for selectors...');
      }
      await page.waitForTimeout(3000);

      // Amazon scraping - Extract product title
      title = await page.evaluate(() => {
        // Try all possible title locations
        let titleEl = document.querySelector('#productTitle');
        if (titleEl) return titleEl.textContent.trim();
        
        titleEl = document.querySelector('span#productTitle');
        if (titleEl) return titleEl.textContent.trim();
        
        titleEl = document.querySelector('h1 span#productTitle');
        if (titleEl) return titleEl.textContent.trim();
        
        // Try any h1
        const h1s = document.querySelectorAll('h1');
        for (const h1 of h1s) {
          const text = h1.textContent.trim();
          if (text && text.length > 5 && text.length < 500) {
            return text;
          }
        }
        
        return 'Product';
      });

      // Extract product description
      description = await page.evaluate(() => {
        // Try product description
        let descEl = document.querySelector('#productDescription_feature_div');
        if (descEl) {
          const text = descEl.innerText || descEl.textContent;
          if (text && text.trim().length > 50) return text.trim();
        }
        
        // Try feature bullets
        descEl = document.querySelector('#feature-bullets ul');
        if (descEl) {
          const text = descEl.innerText || descEl.textContent;
          if (text && text.trim().length > 50) return text.trim();
        }
        
        // Try A+ content
        descEl = document.querySelector('#aplus_feature_div');
        if (descEl) {
          const text = descEl.innerText || descEl.textContent;
          if (text && text.trim().length > 50) return text.trim();
        }
        
        // Fallback: get any description section
        const descSections = document.querySelectorAll('[id*="description"], [id*="Description"]');
        for (const section of descSections) {
          const text = section.innerText || section.textContent;
          if (text && text.trim().length > 100) {
            return text.trim().substring(0, 10000);
          }
        }
        
        return 'No description available';
      });

      // Extract product images - comprehensive method
      images = await page.evaluate(() => {
        const imageUrls = new Set();
        
        // Function to clean and get high-res URL
        const cleanImageUrl = (url) => {
          if (!url || typeof url !== 'string') return null;
          
          // Handle JSON strings
          if (url.startsWith('{') || url.startsWith('[')) {
            try {
              const parsed = JSON.parse(url);
              if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                url = Object.keys(parsed)[0];
              }
            } catch (e) {
              return null;
            }
          }
          
          // Convert to high resolution
          url = url.replace(/\._[A-Z0-9_]+\.(jpg|jpeg|png|gif|webp)/gi, '._AC_SX679_.$1');
          url = url.replace(/\._[A-Z0-9_]+\./, '._AC_SX679_.');
          
          // Must be Amazon URL
          if (url.includes('amazon.com') || url.includes('amazon-adsystem.com') || url.includes('images-na.ssl-images-amazon.com')) {
            return url;
          }
          return null;
        };

        // Method 1: Main landing image
        const mainImg = document.querySelector('#landingImage, #imgBlkFront, #main-image, #imgTagWrapperId img');
        if (mainImg) {
          let src = mainImg.src || mainImg.getAttribute('data-src') || mainImg.getAttribute('data-old-src');
          const cleaned = cleanImageUrl(src);
          if (cleaned) imageUrls.add(cleaned);
        }

        // Method 2: All images in image block
        const imageBlocks = document.querySelectorAll('#imageBlock_feature_div img, #altImages img, #main-image-container img, .imageThumbnail img');
        imageBlocks.forEach(img => {
          let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-old-src') || img.getAttribute('data-zoom-src');
          const cleaned = cleanImageUrl(src);
          if (cleaned) imageUrls.add(cleaned);
        });

        // Method 3: data-a-dynamic-image attribute (most reliable for Amazon)
        const dynamicImages = document.querySelectorAll('[data-a-dynamic-image]');
        dynamicImages.forEach(el => {
          const dataAttr = el.getAttribute('data-a-dynamic-image');
          if (dataAttr) {
            try {
              const parsed = JSON.parse(dataAttr);
              if (typeof parsed === 'object') {
                Object.keys(parsed).forEach(imgUrl => {
                  const cleaned = cleanImageUrl(imgUrl);
                  if (cleaned) imageUrls.add(cleaned);
                });
              }
            } catch (e) {
              // Not JSON, try as direct URL
              const cleaned = cleanImageUrl(dataAttr);
              if (cleaned) imageUrls.add(cleaned);
            }
          }
        });

        // Method 4: Any img tag with amazon domain
        const allImgs = document.querySelectorAll('img');
        allImgs.forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && (src.includes('amazon.com') || src.includes('amazon-adsystem.com'))) {
            const cleaned = cleanImageUrl(src);
            if (cleaned) imageUrls.add(cleaned);
          }
        });

        return Array.from(imageUrls);
      });
      
      console.log('Amazon results - Title:', title ? 'Found' : 'Missing', 'Description:', description && description !== 'No description available' ? 'Found' : 'Missing', 'Images:', images.length);

    } else if (isAliExpress) {
      // Wait for AliExpress page elements
      try {
        await page.waitForSelector('h1, .magnifier-image, img', { timeout: 15000 });
      } catch (e) {
        console.log('Waiting for AliExpress selectors...');
      }
      await page.waitForTimeout(3000);

      // AliExpress scraping - Extract product title
      title = await page.evaluate(() => {
        // Try all possible title locations
        let titleEl = document.querySelector('h1[data-pl="product-title"]');
        if (titleEl) return titleEl.textContent.trim();
        
        titleEl = document.querySelector('h1.product-title-text');
        if (titleEl) return titleEl.textContent.trim();
        
        titleEl = document.querySelector('.product-title-text');
        if (titleEl) return titleEl.textContent.trim();
        
        // Try any h1
        const h1s = document.querySelectorAll('h1');
        for (const h1 of h1s) {
          const text = h1.textContent.trim();
          if (text && text.length > 5 && text.length < 500) {
            return text;
          }
        }
        
        return 'Product';
      });

      // Extract product description
      description = await page.evaluate(() => {
        // Try product description
        let descEl = document.querySelector('.product-description');
        if (descEl) {
          const text = descEl.innerText || descEl.textContent;
          if (text && text.trim().length > 50) return text.trim();
        }
        
        descEl = document.querySelector('[data-pl="product-description"]');
        if (descEl) {
          const text = descEl.innerText || descEl.textContent;
          if (text && text.trim().length > 50) return text.trim();
        }
        
        descEl = document.querySelector('.product-property-main');
        if (descEl) {
          const text = descEl.innerText || descEl.textContent;
          if (text && text.trim().length > 50) return text.trim();
        }
        
        // Fallback: get any description section
        const descSections = document.querySelectorAll('[class*="description"], [class*="detail"]');
        for (const section of descSections) {
          const text = section.innerText || section.textContent;
          if (text && text.trim().length > 100) {
            return text.trim().substring(0, 10000);
          }
        }
        
        return 'No description available';
      });

      // Extract product images - comprehensive method
      images = await page.evaluate(() => {
        const imageUrls = new Set();
        
        // Function to clean and get high-res URL
        const cleanImageUrl = (url) => {
          if (!url || typeof url !== 'string') return null;
          
          // Convert to high resolution
          url = url.replace(/_\d+x\d+\.(jpg|jpeg|png|gif|webp)/gi, '_1000x1000.$1');
          url = url.replace(/_\d+x\d+\./, '_1000x1000.');
          url = url.replace(/!q\d+/, ''); // Remove quality restrictions
          
          // Must be AliExpress URL
          if (url.includes('alicdn.com') || url.includes('ae01') || url.includes('ae02') || url.includes('ae03')) {
            return url;
          }
          return null;
        };

        // Method 1: Main magnifier image
        const mainImg = document.querySelector('.magnifier-image, .images-view-item img, .product-image img');
        if (mainImg) {
          let src = mainImg.src || mainImg.getAttribute('data-src') || mainImg.getAttribute('data-zoom-src');
          const cleaned = cleanImageUrl(src);
          if (cleaned) imageUrls.add(cleaned);
        }

        // Method 2: Gallery images
        const galleryImgs = document.querySelectorAll('.images-view-item img, .gallery-image img, #j-image-thumb-wrap img, [class*="image-view"] img');
        galleryImgs.forEach(img => {
          let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-zoom-src') || img.getAttribute('data-image-src');
          const cleaned = cleanImageUrl(src);
          if (cleaned) imageUrls.add(cleaned);
        });

        // Method 3: Data attributes
        const dataImgs = document.querySelectorAll('[data-src], [data-image-src], [data-zoom-src]');
        dataImgs.forEach(el => {
          const imgUrl = el.getAttribute('data-src') || el.getAttribute('data-image-src') || el.getAttribute('data-zoom-src');
          if (imgUrl) {
            const cleaned = cleanImageUrl(imgUrl);
            if (cleaned) imageUrls.add(cleaned);
          }
        });

        // Method 4: Any img tag with alicdn domain
        const allImgs = document.querySelectorAll('img');
        allImgs.forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && (src.includes('alicdn.com') || src.includes('ae01') || src.includes('ae02') || src.includes('ae03'))) {
            const cleaned = cleanImageUrl(src);
            if (cleaned) imageUrls.add(cleaned);
          }
        });

        return Array.from(imageUrls);
      });
      
      console.log('AliExpress results - Title:', title ? 'Found' : 'Missing', 'Description:', description && description !== 'No description available' ? 'Found' : 'Missing', 'Images:', images.length);

    } else {
      // eBay scraping (existing code)
      // Extract product description
      description = await page.evaluate(() => {
        // Try multiple selectors for description
        const selectors = [
        '#viTabs_0_is',
        '#viTabs_0_is .ux-layout-section-evo',
        '.notranslate',
        '[itemprop="description"]',
        '.ux-layout-section-module',
        '#viTabs_0_is > div > div.ux-layout-section-module > div.ux-layout-section-evo'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.innerText || element.textContent;
          if (text && text.trim().length > 50) {
            return text.trim();
          }
        }
      }

      // Try to find description in iframe
      const iframe = document.querySelector('#desc_wrapper_ctr iframe');
      if (iframe && iframe.contentDocument) {
        const iframeText = iframe.contentDocument.body?.innerText;
        if (iframeText && iframeText.trim().length > 50) {
          return iframeText.trim();
        }
      }

      // Fallback: get main content
      const mainContent = document.querySelector('#mainContent') || document.body;
      const text = mainContent.innerText || mainContent.textContent;
      return text ? text.trim().substring(0, 10000) : 'No description available';
    });

    // Extract product images
    const images = await page.evaluate(() => {
      const imageUrls = new Set();
      
      // Function to get high-res image URL
      const getHighResUrl = (url) => {
        if (!url) return null;
        // Replace thumbnail sizes with high resolution
        url = url.replace(/s-l\d+\.(jpg|jpeg|png|gif|webp)/gi, 's-l1600.$1');
        url = url.replace(/s-m\d+\.(jpg|jpeg|png|gif|webp)/gi, 's-l1600.$1');
        return url;
      };
      
      // Try multiple selectors for images
      const selectors = [
        '#vi_main_img_fs img',
        '#mainImgHldr img',
        '.ux-image-filmstrip-carousel-item img',
        '.ux-image-carousel-item img',
        '[data-testid="ux-image-carousel-item"] img',
        '.vi-image-carousel img',
        'img[itemprop="image"]',
        '.img.imgWr2 img',
        '.ux-image-filmstrip-carousel-item',
        '.ux-image-carousel-item',
        '[data-testid="ux-image-carousel-item"]'
      ];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          let src = null;
          
          // Check if it's an img element
          if (element.tagName === 'IMG') {
            src = element.src || element.getAttribute('data-src') || 
                  element.getAttribute('data-lazy') || element.getAttribute('data-zoom-src');
          } else {
            // Check data attributes for image URLs
            src = element.getAttribute('data-img') || 
                  element.getAttribute('data-src') ||
                  element.getAttribute('data-zoom-src') ||
                  element.getAttribute('href');
            
            // Also check for img inside
            const img = element.querySelector('img');
            if (img) {
              src = img.src || img.getAttribute('data-src') || src;
            }
          }
          
          if (src) {
            src = getHighResUrl(src);
            // Only add eBay image URLs
            if (src && (src.includes('ebayimg.com') || src.includes('ebaystatic.com') || src.includes('i.ebayimg.com'))) {
              imageUrls.add(src);
            }
          }
        });
      });

      // Also check for data attributes on any element
      document.querySelectorAll('[data-img], [data-src], [data-zoom-src]').forEach(el => {
        const imgUrl = el.getAttribute('data-img') || 
                      el.getAttribute('data-src') || 
                      el.getAttribute('data-zoom-src');
        if (imgUrl) {
          const highResUrl = getHighResUrl(imgUrl);
          if (highResUrl && (highResUrl.includes('ebayimg.com') || highResUrl.includes('ebaystatic.com'))) {
            imageUrls.add(highResUrl);
          }
        }
      });

        return Array.from(imageUrls);
      });

      // Extract product title
      title = await page.evaluate(() => {
        const titleSelectors = [
          'h1[id*="title"]',
          'h1.ux-textspans',
          'h1[data-testid="x-item-title-label"]',
          'h1'
        ];

        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            return element.textContent.trim();
          }
        }
        return 'Product';
      });
    }

    await browser.close();

    // Log results for debugging
    console.log('Scraping successful:', {
      platform: isAmazon ? 'Amazon' : (isAliExpress ? 'AliExpress' : 'eBay'),
      title: title ? title.substring(0, 50) + '...' : 'No title',
      descriptionLength: description ? description.length : 0,
      imageCount: images.length
    });

    res.json({
      success: true,
      platform: isAmazon ? 'amazon' : (isAliExpress ? 'aliexpress' : 'ebay'),
      title: title || 'Product',
      description: description || 'No description found',
      images: images.length > 0 ? images : []
    });

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Scraping error:', error);
    console.error('URL attempted:', url);
    console.error('Platform detected:', isAmazon ? 'Amazon' : (isAliExpress ? 'AliExpress' : 'eBay'));
    
    let errorMessage = 'Failed to scrape product. Please check the URL and try again.';
    if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out. The website may be slow or blocking requests. Please try again.';
    } else if (error.message.includes('net::ERR')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      platform: isAmazon ? 'amazon' : (isAliExpress ? 'aliexpress' : 'ebay')
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

