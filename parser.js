const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configure marked to allow custom IDs and maintain safety
marked.setOptions({
  headerIds: true,
  mangle: false
});

function parseMarkdownFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');
  
  let title = '';
  let metaTitle = '';
  let metaDescription = '';
  let pricing = '';
  let imagePrompt = '';
  let markdownBody = [];
  
  let inMetadata = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip Target Keywords, Header Image, and Product Showcase Image bullets so they don't render
    if (trimmed.includes('**Target Keywords:**') || 
        trimmed.includes('**Header Image:**') || 
        trimmed.includes('**Product Showcase Image:**')) {
      continue;
    }
    
    if (trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim();
      continue;
    }
    
    // Parse metadata bullets
    if (inMetadata && (trimmed.startsWith('*') || trimmed.startsWith('-'))) {
      const matchMetaTitle = trimmed.match(/^[*|-]\s+\*\*Meta Title:\*\*\s*(.*)/i) || trimmed.match(/^[*|-]\s+\*\*Page Title:\*\*\s*(.*)/i);
      const matchMetaDesc = trimmed.match(/^[*|-]\s+\*\*Meta Description:\*\*\s*(.*)/i) || trimmed.match(/^[*|-]\s+\*\*SEO Meta Description:\*\*\s*(.*)/i);
      const matchPricing = trimmed.match(/^[*|-]\s+\*\*Pricing \(For Phase 2\):\*\*\s*(.*)/i);
      const matchImage = trimmed.match(/^[*|-]\s+\*\*Recommended Image Prompt:\*\*\s*(.*)/i);
      
      if (matchMetaTitle) {
        metaTitle = matchMetaTitle[1].trim();
        continue;
      }
      if (matchMetaDesc) {
        metaDescription = matchMetaDesc[1].trim();
        continue;
      }
      if (matchPricing) {
        pricing = matchPricing[1].trim();
        continue;
      }
      if (matchImage) {
        imagePrompt = matchImage[1].trim();
        continue;
      }
    }
    
    // If we hit the first separator after the header/metadata list, turn off inMetadata parsing
    if (trimmed === '---' && inMetadata && markdownBody.length < 15) {
      inMetadata = false;
      continue;
    }
    
    markdownBody.push(line);
  }
  
  // Reconstruct body and parse with marked
  const bodyText = markdownBody.join('\n').trim();
  const htmlContent = marked.parse(bodyText);
  
  return {
    title,
    metaTitle,
    metaDescription,
    pricing,
    imagePrompt,
    htmlContent,
    rawContent: bodyText
  };
}

// Map files to clean slugs
const blogMapping = {
  'recognizing-preventing-heatstroke': '01_recognizing_preventing_heatstroke.md',
  'breeds-at-risk-summer': '02_breeds_at_risk_summer.md',
  'ice-water-vs-cooling-vests': '03_ice_water_vs_cooling_vests.md',
  'pavement-temp-walk-test': '04_pavement_temp_walk_test.md'
};

const productMapping = {
  'core-cooling-vest': 'product_core_cooling_vest.md',
  'cooling-mat': 'product_cooling_mat.md',
  'portable-flask': 'product_portable_flask.md',
  'summer-safety-kit': 'bundle_summer_safety_kit.md',
  'ultimate-cooldown': 'bundle_ultimate_cooldown.md'
};

const blogImages = {
  'recognizing-preventing-heatstroke': '/images/blog_heatstroke_header.jpg',
  'breeds-at-risk-summer': '/images/blog_at_risk_breeds.jpg',
  'ice-water-vs-cooling-vests': '/images/blog_ice_vs_vest.jpg',
  'pavement-temp-walk-test': '/images/blog_pavement_test.jpg'
};

const productImages = {
  'core-cooling-vest': '/images/product_cooling_vest.jpg',
  'cooling-mat': '/images/product_cooling_mat.jpg',
  'portable-flask': '/images/product_portable_flask.jpg',
  'summer-safety-kit': '/images/product_cooling_vest.jpg',
  'ultimate-cooldown': '/images/product_cooling_mat.jpg'
};

function getBlogs(assetsDir) {
  const blogsPath = path.join(assetsDir, 'blogs');
  return Object.keys(blogMapping).map(slug => {
    const fileName = blogMapping[slug];
    const fullPath = path.join(blogsPath, fileName);
    const parsed = parseMarkdownFile(fullPath);
    return {
      slug,
      fileName,
      image: blogImages[slug] || '/images/blog_heatstroke_header.jpg',
      ...parsed
    };
  });
}

function getProducts(assetsDir) {
  const productsPath = path.join(assetsDir, 'products');
  return Object.keys(productMapping).map(slug => {
    const fileName = productMapping[slug];
    const fullPath = path.join(productsPath, fileName);
    const parsed = parseMarkdownFile(fullPath);
    
    // Determine type (product vs bundle) and clean pricing numeric value
    const isBundle = fileName.startsWith('bundle_');
    const numericPricing = parseFloat(parsed.pricing.replace(/[^0-9.]/g, ''));
    
    return {
      slug,
      fileName,
      isBundle,
      numericPricing,
      image: productImages[slug] || '/images/product_cooling_vest.jpg',
      ...parsed
    };
  });
}

function getShorts(assetsDir) {
  const shortsPath = path.join(assetsDir, 'youtube_shorts', 'shorts_scripts_pack.md');
  if (!fs.existsSync(shortsPath)) return [];
  
  const content = fs.readFileSync(shortsPath, 'utf8');
  const sections = content.split(/## Script \d+:/).slice(1);
  
  const shortsData = [
    { id: 1, image: '/images/short_2_cooling_vest.jpg', videoUrl: 'https://www.youtube.com/embed/FcmoTOaBVEI' },
    { id: 2, image: '/images/short_3_indoor_recovery.jpg', videoUrl: 'https://www.youtube.com/embed/uRXCtI_gm3s' },
    { id: 3, image: '/images/short_4_silent_signs.jpg', videoUrl: 'https://www.youtube.com/embed/FFtl8zewAn4' }
  ];

  return sections.map((sec, idx) => {
    const lines = sec.split('\n');
    const title = lines[0].trim();
    
    const targetDuration = (sec.match(/\*   \*\*Target Duration:\*\*\s*(.*)/i) || [])[1] || '';
    const videoTitle = (sec.match(/\*   \*\*Video Title:\*\*\s*(.*)/i) || [])[1] || '';
    const videoDesc = (sec.match(/\*   \*\*Video Description:\*\*\s*(.*)/i) || [])[1] || '';
    const hashtags = (sec.match(/\*   \*\*Hashtags:\*\*\s*(.*)/i) || [])[1] || '';

    // Extract table rows
    const tableRows = [];
    const tableMatch = sec.match(/\| Time \| Visual Scene \| Audio \/ Voiceover \| Sound FX \/ Text on Screen \|[\s\S]*?(?=\n\n|\n---|$)/);
    if (tableMatch) {
      const rowLines = tableMatch[0].split('\n').filter(l => l.startsWith('|') && !l.includes('Visual Scene') && !l.includes(':---'));
      rowLines.forEach(rl => {
        const parts = rl.split('|').map(p => p.trim()).filter(p => p !== '');
        if (parts.length >= 4) {
          tableRows.push({
            time: parts[0],
            visual: parts[1],
            audio: parts[2],
            sfxText: parts[3].replace(/<br>/g, ' ')
          });
        }
      });
    }

    const shortMeta = shortsData[idx] || { id: idx + 1, image: '/images/short_1_pavement_test.jpg' };

    return {
      id: shortMeta.id,
      title,
      targetDuration,
      videoTitle,
      videoDesc,
      hashtags,
      image: shortMeta.image,
      videoUrl: shortMeta.videoUrl,
      storyboard: tableRows
    };
  });
}

module.exports = {
  parseMarkdownFile,
  getBlogs,
  getProducts,
  getShorts,
  blogMapping,
  productMapping
};

