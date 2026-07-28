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
const assetsDir = path.join(__dirname, '../dogfriz_assets');

// Store global site mode in server memory for easy local toggling
let siteMode = 'phase1'; // 'phase1' or 'phase2'
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
  res.locals.siteMode = siteMode;
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
    pageTitle: 'Home', 
    activeNav: 'home',
    latestBlogs,
    featuredProducts
  });
});

app.get('/blogs', (req, res) => {
  res.render('blogs', { 
    pageTitle: 'Summer Safety Guides', 
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
    activeNav: 'blogs', 
    blog 
  });
});

app.get('/products', (req, res) => {
  res.render('products', { 
    pageTitle: 'Canine Gear Science', 
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
    activeNav: 'products', 
    product 
  });
});

app.get('/mission', (req, res) => {
  res.render('mission', { 
    pageTitle: 'Our Mission', 
    activeNav: 'mission' 
  });
});

app.get('/shorts', (req, res) => {
  res.render('shorts', { 
    pageTitle: 'YouTube Shorts & Video Strategy', 
    activeNav: 'shorts' 
  });
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
  res.json({ siteMode, contactMessagesCount: contactMessages.length, contactMessages });
});

app.post('/api/toggle-mode', (req, res) => {
  siteMode = siteMode === 'phase1' ? 'phase2' : 'phase1';
  res.json({ success: true, siteMode });
});

// 404 Route
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found', activeNav: '' });
});

app.listen(PORT, () => {
  console.log(`Dogfriz server running at http://localhost:${PORT}`);
});
