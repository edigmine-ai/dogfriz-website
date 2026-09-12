import json
import os
import requests
import datetime
from google import genai

# Security first: Load secrets from environment variables (for cloud/Actions) or local settings (for local run)
API_KEY = os.environ.get("GEMINI_API_KEY")
ZAPIER_URL = "https://mcp.zapier.com/api/v1/connect"
BLOG_ID = "gid://shopify/Blog/101175427245"

# Save history locally in the repository so GitHub Actions can track and commit it
HISTORY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "blog_history.json")

PRODUCT_SEARCH_MAP = {
    "Total Wellness Kit": "Total Wellness Kit",
    "Targeted Treatment Kit": "Targeted Treatment Kit",
    "Glow Starter Kit": "Glow Starter Kit",
    "NEOGEN Real Vitamin C Serum 32g": "NEOGEN Real Vitamin C Serum 32g",
    "bloom peptide hair+scalp serum": "bloom peptide hair+scalp serum",
    "MIZON Hyaluronic Acid 100 Ampoule 30ml": "MIZON Hyaluronic Acid 100 Ampoule 30ml",
    "4-in-1 Red Light Therapy Wand & Activating Serum Kit": "Therapy Wand",
    "Dry Eye Relief Mask — Electric Heated Warm Compress": "Dry Eye",
    "PurRed™ Light Therapy Mask": "PurRed Light Therapy Mask"
}

PRODUCT_CATALOG = [
    {"value": "gid://shopify/Product/8740212703405", "label": "Total Wellness Kit"},
    {"value": "gid://shopify/Product/8740201201837", "label": "Targeted Treatment Kit"},
    {"value": "gid://shopify/Product/8740181737645", "label": "Glow Starter Kit"},
    {"value": "gid://shopify/Product/8728266211501", "label": "NEOGEN Real Vitamin C Serum 32g"},
    {"value": "gid://shopify/Product/8728257822893", "label": "bloom peptide hair+scalp serum"},
    {"value": "gid://shopify/Product/8728251269293", "label": "MIZON Hyaluronic Acid 100 Ampoule 30ml"},
    {"value": "gid://shopify/Product/8728237080749", "label": "4-in-1 Red Light Therapy Wand & Activating Serum Kit"},
    {"value": "gid://shopify/Product/8728227709101", "label": "Dry Eye Relief Mask — Electric Heated Warm Compress"},
    {"value": "gid://shopify/Product/8707183902893", "label": "PurRed™ Light Therapy Mask"}
]

client = genai.Client(api_key=API_KEY)

def log_message(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def get_zapier_token():
    # If in GitHub Actions, return the environment secret token directly
    env_token = os.environ.get("ZAPIER_TOKEN")
    if env_token:
        return env_token
        
    # Otherwise look up local mcp-oauth-tokens.json for local runs
    token_file = "/home/edigmine/.gemini/mcp-oauth-tokens.json"
    if os.path.exists(token_file):
        try:
            with open(token_file, "r") as f:
                tokens = json.load(f)
                for item in tokens:
                    if item.get("serverName") == "zapier":
                        return item["token"]["accessToken"]
        except Exception as e:
            log_message(f"Error reading token file: {e}")
    return "c/PJyMZvKfvR+k+02l8lBimD8QBiUZHp4hFhPDoJp0g=" # Default fallback

def call_zapier_mcp(tool_name, arguments):
    token = get_zapier_token()
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': f'Bearer {token}'
    }
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        },
        "id": 1
    }
    try:
        response = requests.post(ZAPIER_URL, json=payload, headers=headers)
        if response.status_code != 200:
            log_message(f"Zapier MCP HTTP Error: {response.status_code}")
            return None
            
        # Parse SSE response format
        text = response.text
        data = None
        for line in text.splitlines():
            if line.startswith("data: "):
                data = json.loads(line[6:])
                break
                
        if not data:
            log_message("Failed to extract JSON from SSE response.")
            return None
            
        if "error" in data:
            log_message(f"Zapier MCP Tool Error: {data['error']}")
            return None
        # Extract content text and parse it as JSON
        content_text = data["result"]["content"][0]["text"]
        return json.loads(content_text)
    except Exception as e:
        log_message(f"Error calling Zapier MCP: {e}")
        return None

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            log_message(f"Error loading history, resetting: {e}")
            return []
    return []

def save_history(history):
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        log_message(f"Error saving history: {e}")

def get_product_details(title, search_keyword):
    log_message(f"Fetching full details for product: '{title}'...")
    data = call_zapier_mcp("shopify_find_products_by_title_with_line_item_supp", {
        "output_hint": "Retrieve details: id, title, description, and handle",
        "titles": [search_keyword]
    })
    if data and "results" in data and len(data["results"]) > 0:
        results = data["results"]
        if isinstance(results, list):
            return results[0]
        return results
    return None

def generate_image_and_upload(product_title):
    log_message(f"Generating high-end customized cover image for '{product_title}'...")
    
    # Dynamic Aesthetic & Palette Generator
    product_lower = product_title.lower()
    
    if "vitamin c" in product_lower or "neogen" in product_lower:
        palette = "warm golden-hour sun-drenched lighting, rich amber and bright orange accents"
        props = "organic fresh sliced oranges and citrus fruits with light condensation"
        surface = "clean warm-toned travertine stone ledge"
    elif "peptide" in product_lower or "bloom" in product_lower:
        palette = "botanical soft green and crisp white color palette, fresh morning dew lighting"
        props = "delicate rosemary sprigs and fresh dewy eucalyptus leaves"
        surface = "natural slate stone tile surface"
    elif "hyaluronic" in product_lower or "mizon" in product_lower:
        palette = "cool refreshing aquatic blue and silver tones, clean backlighting"
        props = "frosty clear water droplets, gentle water ripples, and translucent serum splash"
        surface = "modern clear acrylic vanity tray"
    elif "wand" in product_lower:
        palette = "luxe warm metallic and soft champagne hues, elegant soft-diffused backdrop"
        props = "premium rose-gold skincare wand and serum dropper bottle"
        surface = "minimalist cream-colored ceramic vanity"
    elif "dry eye" in product_lower or "heated" in product_lower:
        palette = "cozy relaxing warm lavender and soft grey palette, calming candlelit glow"
        props = "plush folded white spa linens, relaxed lavender sprigs, and chamomile flowers"
        surface = "natural warm cedar wood surface"
    elif "purred" in product_lower or "led light" in product_lower:
        palette = "sleek high-tech minimalist beauty aesthetic, soft therapeutic red light ambient glow"
        props = "a premium sleek white LED light therapy facial mask glowing gently"
        surface = "luxurious reflective dark glass counter"
    else:
        # Defaults for Kits and other products
        palette = "neutral warm sand and beige tones, elegant natural lighting with soft shadows"
        props = "curated premium beauty kit arrangement, glass droppers, and minimalist accessories"
        surface = "sleek minimalist marble surface"

    prompt = f"""
Editorial skincare product photography of '{product_title}', high-end luxury beauty brand aesthetic.
Color Palette & Lighting: {palette}.
Featured Elements & Props: {props}.
Surface: {surface}.
Style: Minimalist composition, Hasselblad medium format camera look, 85mm lens, f/1.8 aperture, 
soft natural depth of field, high-resolution textures, pristine and clean, 16:9 aspect ratio.
"""
    try:
        response = client.models.generate_content(
            model='gemini-3-pro-image',
            contents=prompt
        )
        image_bytes = None
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                image_bytes = part.inline_data.data
                break
        
        if not image_bytes:
            log_message("No image bytes returned from Gemini.")
            return None
        
        log_message("Uploading professional cover image to Catbox...")
        files = {
            'reqtype': (None, 'fileupload'),
            'fileToUpload': ('blog_cover.jpg', image_bytes, 'image/jpeg')
        }
        res = requests.post('https://catbox.moe/user/api.php', files=files)
        public_url = res.text.strip()
        log_message(f"Professional cover image uploaded successfully: {public_url}")
        return public_url
    except Exception as e:
        log_message(f"Error generating/uploading image: {e}")
        return None

def get_daily_theme():
    themes = {
        0: { # Monday
            "angle": "Scientific Deep-Dive & Botanical Benefits",
            "focus": "Focus heavily on the proven science of the active ingredients, how they interact, and their cosmetic support mechanisms."
        },
        1: { # Tuesday
            "angle": "Dynamic Step-by-Step Routine Integration",
            "focus": "Focus on step-by-step practical routine integration. Outline morning and night rituals, and explain how to layer this product with other common skincare steps."
        },
        2: { # Wednesday
            "angle": "Mindful Self-Care & Evening Wellness Ritual",
            "focus": "Focus heavily on lifestyle, evening wind-down rituals, mental relaxation, and transforming routine skincare into a sensory self-care experience."
        },
        3: { # Thursday
            "angle": "Ingredient Spotlight & Skin Barrier Safety",
            "focus": "Isolate the single most powerful ingredient in the description (e.g. Vitamin C, Ceramides, or Green Tea) and write an absolute masterclass on its role in skin barrier support."
        },
        4: { # Friday
            "angle": "The Weekend Glow-Up & Preparation",
            "focus": "Focus on preparing the skin for the weekend, achieving a fresh appearance, and quick tips for a healthy, glowing look."
        },
        5: { # Saturday
            "angle": "Curator's Special Q&A & Expert Advice",
            "focus": "Write from the perspective of the GlowMentor curator sharing a personal selection review. Cover frequency of use, skin compatibility, and answers to common user questions."
        },
        6: { # Sunday
            "angle": "Sunday Slow-Down & Recovery Guide",
            "focus": "Focus on recovery, replenishing moisture, calming the appearance of the skin after a busy week, and preparing the skin for the week ahead."
        }
    }
    day_num = datetime.datetime.today().weekday()
    return themes.get(day_num, themes[0])

def write_compliant_blog(product, theme):
    log_message(f"Writing compliant blog using Daily Theme Angle: '{theme['angle']}'...")
    title = product.get("title", "")
    desc = product.get("description", "Premium curated wellness item")
    handle = product.get("handle", "")
    
    prompt = f"""
Write a highly engaging, science-backed, educational skincare/beauty blog post about the following curated product:
- Product Name: {title}
- Original Supplier Description: {desc}

DAILY ANGLE & STRUCTURAL FOCUS:
- Your theme today is: {theme['angle']}
- Instructions: {theme['focus']}

FOLLOW THESE STRICT RULES:
1. CURATED DROPSHIPPING TONALITY: Position GlowMentor as a trusted, expert curator of fine beauty solutions (e.g. "Featured in the GlowMentor curation...", "The [Product Name] available at GlowMentor..."). Never say "we formulated this" or "our laboratory developed this".
2. ZERO INVENTION: Do not invent ingredients, specifications, certifications, benefits, study results, testimonials, or supplier claims. If a detail is missing from the original description, do not include it.
3. COSMETIC SAFETY COMPLIANCE: Avoid all medical, diagnostic, prevention, cure, or guaranteed-result claims. Translate any aggressive supplier claims into safe, cosmetic-supportive language (e.g., change "cures acne" to "helps support clear-looking skin," change "removes deep wrinkles" to "improves the appearance of fine lines").
4. KEY WORDS TO USE: Use careful wording such as "helps support", "improves the appearance of", "hydrates", and "soothes the appearance of".
5. STRUCTURE:
   - Provide an educational, informative introduction tailored to today's theme.
   - Deeply address the weekly/daily theme focus while referencing original facts.
   - Describe who this product is best suited for and how to integrate it.

Return your response strictly as a JSON object with two fields:
- "title": A catchy, elegant, and safe educational article title tailored to today's theme.
- "body_html": The complete article body in well-formatted, beautiful HTML (excluding the CTA button, which will be appended separately). Do not include any JSON formatting wrapper besides raw JSON keys.
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        content_json = json.loads(response.text.strip())
        return content_json
    except Exception as e:
        log_message(f"Error writing blog post content: {e}")
        return None

def run_daily_workflow():
    log_message("====== STARTING DAILY GLOWMENTOR AUTOMATION PIPELINE ======")
    
    # 1. Load history and fetch all products from the baseline catalog
    history = load_history()
    products = PRODUCT_CATALOG
    
    # Filter out recently featured products
    eligible_products = []
    recently_featured = {entry["id"] for entry in history}
    
    for p in products:
        p_id = p["value"]
        p_label = p["label"]
        
        if p_id in recently_featured:
            continue
            
        eligible_products.append(p)
        
    # If all active products have been featured, clear history to start a new rotation cycle
    if not eligible_products:
        log_message("All products have been featured recently. Resetting rotation history.")
        history = []
        save_history(history)
        eligible_products = products
        
    selected_p = eligible_products[0]
    p_id = selected_p["value"]
    p_label = selected_p["label"]
    
    log_message(f"Selected Product for Today: '{p_label}' ({p_id})")
    
    # 2. Fetch full details using the search map
    search_keyword = PRODUCT_SEARCH_MAP.get(p_label, p_label)
    details = get_product_details(p_label, search_keyword)
    if not details:
        log_message(f"Failed to fetch details for '{p_label}'. Aborting.")
        return
        
    # Ensure description and handle are populated
    details["title"] = p_label
    handle = details.get("handle", "")
    if not handle:
        handle = p_label.lower().replace(" ", "-").replace("&", "and").replace('™', '').strip()
        details["handle"] = handle
        
    # 3. Resolve dynamic themed writing angle
    theme = get_daily_theme()
    log_message(f"Today's publication theme: {theme['angle']}")
    
    # 4. Generate article copy
    article = write_compliant_blog(details, theme)
    if not article or "body_html" not in article:
        log_message("Failed to generate article copy. Aborting.")
        return
        
    blog_title = article.get("title", f"Spotlight on {p_label}")
    body_html = article["body_html"]
    
    # 5. Generate CTA Button linking to product
    cta_url = f"https://glowmentor.com/products/{handle}"
    cta_button_html = f"""
    <div style="text-align: center; margin: 40px 0; padding: 20px; background-color: #fcf8f6; border-radius: 8px;">
        <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 16px; color: #4a4a4a; margin-bottom: 15px;">Discover your skin's full potential today.</p>
        <a href="{cta_url}" target="_blank" style="background-color: #000000; color: #ffffff; padding: 14px 35px; text-decoration: none; font-weight: bold; font-family: 'Helvetica Neue', sans-serif; border-radius: 4px; display: inline-block; letter-spacing: 1px; font-size: 14px; text-transform: uppercase; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Shop the {p_label}</a>
    </div>
    """
    body_html += cta_button_html
    
    # 6. Generate high-quality cover image and upload
    image_url = generate_image_and_upload(p_label)
    
    # 7. Publish Blog Entry Live! (published: True)
    log_message(f"Publishing blog post '{blog_title}' live to Shopify...")
    blog_payload = {
        "output_hint": "Retrieve created post details",
        "blog_id": BLOG_ID,
        "title": blog_title,
        "author": "GlowMentor Curator",
        "body_html": body_html,
        "published": True
    }
    if image_url:
        blog_payload["image__src"] = image_url
        
    publish_res = call_zapier_mcp("shopify_create_blog_entry", blog_payload)
    
    if publish_res and "results" in publish_res:
        post_id = publish_res["results"].get("id", "Unknown")
        log_message(f"🎉 SUCCESS! Blog post successfully published live! Post ID: {post_id}")
        
        # Save to history
        history.append({
            "id": p_id,
            "title": p_label,
            "post_id": post_id,
            "blog_title": blog_title,
            "date": datetime.date.today().isoformat()
        })
        save_history(history)
    else:
        log_message("❌ Failed to publish blog post to Shopify.")
        
    log_message("====== DAILY PIPELINE RUN COMPLETE ======")

if __name__ == "__main__":
    run_daily_workflow()
