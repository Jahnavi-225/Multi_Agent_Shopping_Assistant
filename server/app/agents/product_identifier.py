import re
from urllib.parse import urlparse, parse_qs

class ProductIdentifierAgent:
    BRANDS = ["Apple", "Samsung", "Sony", "Nike", "Dell", "HP", "Lenovo", "Asus", "OnePlus", "Xiaomi", "Realme", "Bose", "JBL", "Adidas", "Puma", "Biba", "Manyavar", "Zaveri Pearls", "FabIndia", "Kalyan", "Tanishq", "Milton", "Prestige", "Nivea", "L'Oreal", "Bombay Dyeing"]
    CATEGORIES = {
        "Smartphones": ["iphone", "galaxy", "pixel", "oneplus", "phone", "smartphone", "5g", "s24", "mobile"],
        "Laptops": ["macbook", "laptop", "thinkpad", "zenbook", "notebook", "ssd", "ram", "m3", "i7", "i5"],
        "Headphones": ["headphones", "earbuds", "wh-1000xm5", "airpods", "headset", "anc", "noise canceling", "bluetooth"],
        "Footwear": ["shoes", "jordan", "sneakers", "nike", "adidas", "retro", "running shoes"],
        "TVs": ["tv", "smart tv", "oled", "4k", "qled", "bravia"],
        "Jewellery": ["earrings", "earring", "necklace", "ring", "bracelet", "jewellery", "jewelry", "pendant", "jhumka", "bangles", "gold", "silver"],
        "Apparel & Fashion": ["saree", "sarees", "dress", "shirt", "jeans", "clothing", "apparel", "kurta", "top", "lehenga", "suit", "jacket", "t-shirt", "ethnic", "fashion"],
        "Bedding & Linens": ["bedsheet", "bedsheets", "pillow", "blanket", "quilt", "linen", "curtain", "bed cover"],
        "Kitchenware": ["cookware", "pan", "pot", "cooker", "bottle", "container", "kitchenware", "cutlery", "pressure cooker", "kadai"],
        "Personal Care": ["shampoo", "soap", "lotion", "sanitary", "skincare", "cream", "perfume", "deodorant", "face wash"],
        "Home & Decor": ["lamp", "vase", "clock", "decorative", "chair", "cushion", "decor", "wall art", "mirror"]
    }

    SUPPORTED_DOMAINS = [
        "amazon.in", "amazon.com", "flipkart.com", "myntra.com",
        "reliancedigital.in", "croma.com", "snapdeal.com",
        "meesho.com", "tatacliq.com", "ajio.com"
    ]

    @classmethod
    def process_input(cls, query_or_url):
        query_or_url = query_or_url.strip()
        is_url = bool(re.match(r'https?://', query_or_url, re.IGNORECASE))

        extracted_info = {
            "is_url": is_url,
            "raw_input": query_or_url,
            "domain": None,
            "detected_brand": None,
            "detected_category": None,
            "clean_title": query_or_url,
            "specs_extracted": {}
        }

        if is_url:
            try:
                parsed = urlparse(query_or_url)
                domain = parsed.netloc.replace("www.", "").lower()
                extracted_info["domain"] = domain
                
                path_parts = [p for p in parsed.path.split('/') if p]
                if path_parts:
                    raw_slug = path_parts[0]
                    if raw_slug.lower() in ["dp", "p", "product", "buy", "s", "item"]:
                        raw_slug = path_parts[1] if len(path_parts) > 1 else raw_slug
                    
                    # Clean up URL slugs
                    clean_slug = re.sub(r'[-_]', ' ', raw_slug)
                    clean_slug = re.sub(r'itm[a-z0-9]+', '', clean_slug, flags=re.IGNORECASE)
                    clean_slug = re.sub(r'p\d+', '', clean_slug, flags=re.IGNORECASE)
                    extracted_info["clean_title"] = clean_slug.strip().title()
            except Exception as e:
                print(f"URL parse error: {e}")

        title_text = extracted_info["clean_title"].lower()

        # Identify Brand
        for brand in cls.BRANDS:
            if brand.lower() in title_text:
                extracted_info["detected_brand"] = brand
                break

        # Identify Category
        for cat, keywords in cls.CATEGORIES.items():
            if any(kw in title_text for kw in keywords):
                extracted_info["detected_category"] = cat
                break

        # Extract Storage / RAM specs via Regex
        storage_match = re.search(r'(\d+\s*(?:gb|tb))', title_text, re.IGNORECASE)
        if storage_match:
            extracted_info["specs_extracted"]["Storage"] = storage_match.group(1).upper()

        ram_match = re.search(r'(\d+\s*gb\s*ram)', title_text, re.IGNORECASE)
        if ram_match:
            extracted_info["specs_extracted"]["RAM"] = ram_match.group(1).upper()

        return extracted_info
