const express = require('express');
const path = require('path');
const parser = require('./parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Path to assets directory
const assetsDir = path.join(__dirname, 'dogfriz_assets');

let contactMessages = []; // Local memory store for contact submissions

// Cache loaded blogs, products, and shorts
let blogs = [];
let products = [];
let shorts = [];

try {
  blogs = parser.getBlogs(assetsDir);
  products = parser.getProducts(assetsDir);
  shorts = parser.getShorts(assetsDir);
  console.log(`Successfully parsed ${blogs.length} blogs, ${products.length} products, and ${shorts.length} YouTube Shorts.`);
} catch (error) {
  console.error('Error parsing dogfriz_assets:', error);
}

// Helpers
app.use((req, res, next) => {
  res.locals.siteMode = 'phase1';
  res.locals.blogs = blogs;
  res.locals.products = products;
  res.locals.shorts = shorts;
  res.locals.contactMessages = contactMessages;
  next();
});

// Routes
app.get('/', (req, res) => {
  // Pass 2 latest blogs and 3 standard products for the homepage
  const latestBlogs = blogs.slice(0, 2);
  const featuredProducts = products.filter(p => !p.isBundle).slice(0, 3);
  res.render('index', { 
    pageTitle: 'Cooling Vests & Mats for Dogs | Summer Safety Gear', 
    metaDescription: 'Keep your dog safe and cool this summer with Dogfriz veterinarian-approved evaporative cooling vests, pads, and flasks designed for canine thermal regulation.',
    ogImage: '/images/product_cooling_vest.jpg',
    activeNav: 'home',
    latestBlogs,
    featuredProducts
  });
});

app.get('/blogs', (req, res) => {
  res.render('blogs', { 
    pageTitle: 'Summer Safety Guides', 
    metaDescription: 'Read our expert canine summer safety guides, including recognizing and preventing doggy heatstroke, hot pavement walking tests, and science-backed dog cooling tips.',
    ogImage: '/images/blog_heatstroke_header.jpg',
    activeNav: 'blogs' 
  });
});

app.get('/blogs/:slug', (req, res) => {
  const blog = blogs.find(b => b.slug === req.params.slug);
  if (!blog) {
    return res.status(404).render('404', { pageTitle: 'Page Not Found', activeNav: '' });
  }
  res.render('blog-detail', { 
    pageTitle: blog.metaTitle || blog.title, 
    metaDescription: blog.metaDescription,
    ogImage: blog.image,
    activeNav: 'blogs', 
    blog 
  });
});

app.get('/products', (req, res) => {
  res.render('products', { 
    pageTitle: 'Canine Gear Science', 
    metaDescription: 'Discover the scientific design behind Dogfriz canine cooling gear, including core cooling vests, self-cooling mats, and portable hydration flasks.',
    ogImage: '/images/product_cooling_vest.jpg',
    activeNav: 'products' 
  });
});

app.get('/products/:slug', (req, res) => {
  const product = products.find(p => p.slug === req.params.slug);
  if (!product) {
    return res.status(404).render('404', { pageTitle: 'Page Not Found', activeNav: '' });
  }
  res.render('product-detail', { 
    pageTitle: product.metaTitle || product.title, 
    metaDescription: product.metaDescription,
    ogImage: product.image,
    activeNav: 'products', 
    product 
  });
});

app.get('/mission', (req, res) => {
  res.render('mission', { 
    pageTitle: 'Our Mission', 
    metaDescription: 'Learn about the Dogfriz mission to prevent heat exhaustion and hot weather injury in dogs through science-based education and advanced cooling engineering.',
    ogImage: '/images/product_cooling_vest.jpg',
    activeNav: 'mission' 
  });
});

app.get('/social-media', (req, res) => {
  res.render('social-media', { 
    pageTitle: 'Social Media', 
    metaDescription: 'Explore our official Dogfriz social media accounts and safety resources.',
    ogImage: '/images/short_2_cooling_vest.jpg',
    activeNav: 'social-media' 
  });
});

app.get('/get-in-touch', (req, res) => {
  res.render('get-in-touch', { 
    pageTitle: 'Get In Touch', 
    metaDescription: 'Have questions about canine summer safety? Our safety team and veterinary critical care consultants are available to help.',
    ogImage: '/images/product_cooling_vest.jpg',
    activeNav: 'get-in-touch' 
  });
});

// Dynamic XML Sitemap for Google Search Console
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  const host = 'https://dogfriz-website.onrender.com';
  
  // Core pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/blogs', priority: '0.8', changefreq: 'weekly' },
    { url: '/products', priority: '0.8', changefreq: 'weekly' },
    { url: '/mission', priority: '0.7', changefreq: 'monthly' },
    { url: '/social-media', priority: '0.7', changefreq: 'weekly' },
    { url: '/get-in-touch', priority: '0.7', changefreq: 'monthly' }
  ];
  
  staticPages.forEach(p => {
    xml += `  <url>\n    <loc>${host}${p.url}</loc>\n    <priority>${p.priority}</priority>\n    <changefreq>${p.changefreq}</changefreq>\n  </url>\n`;
  });
  
  // Blog pages
  blogs.forEach(b => {
    xml += `  <url>\n    <loc>${host}/blogs/${b.slug}</loc>\n    <priority>0.6</priority>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  });
  
  // Product pages
  products.forEach(p => {
    xml += `  <url>\n    <loc>${host}/products/${p.slug}</loc>\n    <priority>0.7</priority>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  });
  
  xml += '</urlset>';
  res.send(xml);
});

// Robots.txt file
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /

Sitemap: https://dogfriz-website.onrender.com/sitemap.xml`);
});

// Simulated Contact Form Submission
app.post('/contact', (req, res) => {
  const { name, email, message, subject } = req.body;
  if (name && email && message) {
    contactMessages.push({
      id: Date.now(),
      name,
      email,
      subject: subject || 'General Inquiry',
      message,
      date: new Date().toLocaleString()
    });
    res.json({ success: true, message: 'Thank you for reaching out! Your message has been safely received.' });
  } else {
    res.status(400).json({ success: false, message: 'Please fill out all required fields.' });
  }
});

// Admin Panel API endpoints for local demo
app.get('/api/state', (req, res) => {
  res.json({ siteMode: 'phase1', contactMessagesCount: contactMessages.length, contactMessages });
});

// 404 Route
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found', activeNav: '' });
});

app.listen(PORT, () => {
  console.log(`Dogfriz server running at http://localhost:${PORT}`);
});
