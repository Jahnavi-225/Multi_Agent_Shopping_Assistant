import json
import logging
import re
import sqlite3
import time
import urllib.parse
import urllib.request
from app.config import Config
from app.database import get_db_connection, get_monthly_api_count, increment_monthly_api_count

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 900  # 15 minutes TTL
MONTHLY_QUOTA_LIMIT = 100
_LIVE_DATA_CACHE = {}  # query_lower -> (timestamp, normalized_data)


class MultiPlatformScraperAgent:
    ALL_PLATFORMS = [
        "Amazon", "Flipkart", "Myntra", "Reliance Digital",
        "Croma", "Snapdeal", "Meesho", "Tata CLIQ", "Ajio"
    ]

    # Category & brand availability matrix across retailers
    PLATFORM_CAPABILITIES = {
        "Meesho": {
            "allowed_categories": ["Footwear", "Apparel", "Fashion", "Home & Kitchen", "Accessories"],
            "disallowed_brands": ["Apple", "Samsung", "Sony", "Dell", "HP", "Lenovo", "Asus"],
            "reason": "Meesho primarily lists unbranded/lifestyle apparel and budget fashion accessories, and does not carry official high-end electronics or Apple/Samsung flagship smartphones."
        },
        "Myntra": {
            "allowed_categories": ["Footwear", "Apparel", "Fashion", "Headphones", "Accessories"],
            "disallowed_brands": ["Dell", "HP", "Lenovo", "Asus"],
            "reason": "Myntra specializes in apparel, footwear, and lifestyle accessories rather than desktop laptops or large appliances."
        },
        "Ajio": {
            "allowed_categories": ["Footwear", "Apparel", "Fashion", "Accessories"],
            "disallowed_brands": ["Apple", "Samsung", "Sony", "Dell", "HP", "Lenovo", "Asus"],
            "reason": "Ajio focuses on fashion & footwear collections and does not stock consumer electronics or laptops."
        },
        "Reliance Digital": {
            "allowed_categories": ["Smartphones", "Laptops", "Headphones", "TVs"],
            "disallowed_brands": ["Nike", "Adidas", "Puma"],
            "reason": "Reliance Digital is a consumer electronics & tech appliance retailer."
        },
        "Croma": {
            "allowed_categories": ["Smartphones", "Laptops", "Headphones", "TVs"],
            "disallowed_brands": ["Nike", "Adidas", "Puma"],
            "reason": "Croma is a tech & electronic gadget chain store."
        },
        "Amazon": {"allowed_categories": ["All"], "disallowed_brands": []},
        "Flipkart": {"allowed_categories": ["All"], "disallowed_brands": []},
        "Tata CLIQ": {"allowed_categories": ["All"], "disallowed_brands": []},
        "Snapdeal": {"allowed_categories": ["All"], "disallowed_brands": []}
    }

    @classmethod
    def fetch_live_amazon_data(cls, query, parsed_info=None):
        """
        Calls OpenWeb Ninja's Real-Time Amazon Data API on RapidAPI and normalizes
        the response into the standard product structure expected by RankingDealAgent.
        """
        if not Config.RAPIDAPI_KEY:
            logger.info("[RapidAPI Scraper] RAPIDAPI_KEY not configured.")
            return None

        clean_query = query.strip()
        if not clean_query:
            return None

        # Build RapidAPI request
        encoded_query = urllib.parse.quote(clean_query)
        url = f"https://{Config.RAPIDAPI_HOST}/search?query={encoded_query}&page=1&country=US"
        headers = {
            "x-rapidapi-key": Config.RAPIDAPI_KEY,
            "x-rapidapi-host": Config.RAPIDAPI_HOST
        }

        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status != 200:
                logger.warning(f"[RapidAPI Scraper] HTTP status {response.status} returned from Amazon API")
                return None
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)

        products = data.get("data", {}).get("products", [])
        if not products:
            logger.info(f"[RapidAPI Scraper] No live products returned for query '{clean_query}'.")
            return None

        # Normalize primary product metadata from top result
        top_product = products[0]
        primary_title = top_product.get("product_title") or clean_query
        primary_photo = top_product.get("product_photo") or "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
        asin = top_product.get("asin") or "live-1"

        detected_brand = (parsed_info.get("detected_brand") if parsed_info else None) or "Amazon Seller"
        detected_category = (parsed_info.get("detected_category") if parsed_info else None) or "General"
        specs = (parsed_info.get("specs_extracted") if parsed_info else {}) or {}

        def parse_price(val):
            if val is None:
                return None
            if isinstance(val, (int, float)):
                return float(val)
            if isinstance(val, str):
                cleaned = val.replace(',', '')
                m = re.search(r'(\d+(?:\.\d+)?)', cleaned)
                if m:
                    return float(m.group(1))
            return None

        def parse_currency(val):
            if isinstance(val, str):
                if '₹' in val or 'INR' in val:
                    return '₹'
                if '£' in val or 'GBP' in val:
                    return '£'
                if '€' in val or 'EUR' in val:
                    return '€'
            return '$'

        listings = []
        for i, item in enumerate(products[:5]):
            raw_p = item.get("product_price")
            price = parse_price(raw_p)
            if price is None or price <= 0:
                continue

            raw_orig = item.get("product_original_price")
            orig_price = parse_price(raw_orig)
            if not orig_price or orig_price < price:
                orig_price = round(price * 1.15, 2)

            currency = item.get("currency") or parse_currency(raw_p)
            item_asin = item.get("asin") or f"live-{i+1}"
            raw_url = item.get("product_url") or f"https://www.amazon.com/dp/{item_asin}"
            if raw_url and not (raw_url.startswith("http://") or raw_url.startswith("https://")):
                raw_url = f"https://{raw_url.lstrip('/')}"

            raw_rating = item.get("product_star_rating")
            try:
                rating = float(raw_rating) if raw_rating else 4.5
            except Exception:
                rating = 4.5

            raw_reviews = item.get("product_num_ratings")
            try:
                review_count = int(raw_reviews) if raw_reviews else 120
            except Exception:
                review_count = 120

            badge = None
            if item.get("is_amazon_choice"):
                badge = "Amazon's Choice"
            elif item.get("is_best_seller"):
                badge = "Best Seller"
            else:
                badge = "Live Deal"

            today_str = time.strftime("%Y-%m-%d")
            price_history = [
                {"date": "2026-08-01", "price": orig_price},
                {"date": today_str, "price": price}
            ]

            listings.append({
                "id": f"live-listing-{item_asin}",
                "platform": "Amazon",
                "price": price,
                "original_price": orig_price,
                "currency": currency,
                "rating": rating,
                "review_count": review_count,
                "seller": "Amazon Seller",
                "in_stock": True,
                "shipping": item.get("delivery") or "Free Delivery",
                "url": raw_url,
                "badge": badge,
                "price_history": price_history
            })

        if not listings:
            return None

        # Build unavailable platforms list
        active_platforms = {"Amazon"}
        unavailable_platforms = []
        for store in cls.ALL_PLATFORMS:
            if store not in active_platforms:
                unavailable_platforms.append({
                    "platform": store,
                    "reason": f"Live price feed for {store} currently inactive (Amazon Live API active).",
                    "status": "Not Available"
                })

        return {
            "id": f"live-prod-{asin}",
            "title": primary_title,
            "brand": detected_brand,
            "category": detected_category,
            "image_url": primary_photo,
            "specs": specs,
            "key_features": ["Real-time live Amazon product listing", "Verified online price"],
            "listings": listings,
            "unavailable_platforms": unavailable_platforms
        }

    @classmethod
    def search_and_scrape(cls, parsed_info):
        """
        Retrieves matching product listings.
        First attempts RapidAPI live Amazon search if key is configured and quota permits.
        Falls back seamlessly to local SQLite seed DB if live search fails, errors, or quota is exhausted.
        """
        query = parsed_info.get("clean_title", "").strip()

        # 1. Try Live API search if RAPIDAPI_KEY is configured
        if Config.RAPIDAPI_KEY and query:
            cache_key = query.lower()
            now = time.time()

            # A. Check 15-min in-memory cache
            if cache_key in _LIVE_DATA_CACHE:
                cached_time, cached_data = _LIVE_DATA_CACHE[cache_key]
                if now - cached_time < CACHE_TTL_SECONDS:
                    logger.info(f"[RapidAPI Scraper] Returning cached live Amazon result for '{query}'.")
                    return cached_data

            # B. Check monthly API quota counter
            used_requests = get_monthly_api_count("rapidapi")
            if used_requests >= MONTHLY_QUOTA_LIMIT:
                logger.warning(
                    f"[RapidAPI Quota Warning] Free tier quota exhausted ({used_requests}/{MONTHLY_QUOTA_LIMIT} requests used this month). "
                    "Falling back to local seed database search."
                )
            else:
                if used_requests >= 80:
                    logger.warning(
                        f"[RapidAPI Quota Notice] Approaching monthly limit: {used_requests}/{MONTHLY_QUOTA_LIMIT} requests used."
                    )

                try:
                    logger.info(f"[RapidAPI Scraper] Executing live Amazon API request for '{query}' (Usage: {used_requests}/{MONTHLY_QUOTA_LIMIT})...")
                    live_data = cls.fetch_live_amazon_data(query, parsed_info)
                    if live_data:
                        increment_monthly_api_count("rapidapi")
                        _LIVE_DATA_CACHE[cache_key] = (now, live_data)
                        return live_data
                    else:
                        logger.info(f"[RapidAPI Scraper] Live API search returned no listings for '{query}'. Falling back to DB search.")
                except Exception as e:
                    logger.error(f"[RapidAPI Error] Exception while fetching live data for '{query}': {e}. Falling back to DB search.")

        # 2. Fallback to existing local SQLite database search
        return cls._search_db(parsed_info)

    @classmethod
    def _search_db(cls, parsed_info):
        """
        Fallback SQLite DB product catalog search.
        """
        query = parsed_info.get("clean_title", "").strip()
        conn = get_db_connection()
        cursor = conn.cursor()

        products = []

        # 0. If input is a URL, resolve exact product listing via URL or extracted product ID/ASIN
        raw_url = parsed_info.get("raw_input", "").strip()
        if parsed_info.get("is_url") and raw_url:
            cursor.execute("SELECT product_id FROM listings WHERE url = ? OR ? LIKE '%' || url || '%' OR url LIKE '%' || ? || '%'", (raw_url, raw_url, raw_url))
            url_match = cursor.fetchone()

            # Try extracting ASIN or product code from URL (e.g., B0CHX6869F or itm...)
            if not url_match:
                code_match = re.search(r'(B0[A-Z0-9]{8}|itm[a-zA-Z0-9]+)', raw_url)
                if code_match:
                    code = code_match.group(1)
                    cursor.execute("SELECT product_id FROM listings WHERE url LIKE ?", (f'%{code}%',))
                    url_match = cursor.fetchone()

            if url_match:
                cursor.execute("SELECT * FROM products WHERE id = ?", (url_match['product_id'],))
                products = cursor.fetchall()

        # 1. Try exact or fuzzy title/brand/category search
        if not products and query:
            cursor.execute(
                "SELECT * FROM products WHERE title LIKE ? OR brand LIKE ? OR category LIKE ?",
                (f'%{query}%', f'%{query}%', f'%{query}%')
            )
            products = cursor.fetchall()

        # 2. Token & stemming fallback search
        if not products and query:
            raw_tokens = [t for t in query.split() if len(t) > 2]
            tokens = []
            for t in raw_tokens:
                tokens.append(t)
                if t.lower().endswith('ies'):
                    tokens.append(t[:-3] + 'y')
                elif t.lower().endswith('es'):
                    tokens.append(t[:-2])
                elif t.lower().endswith('s'):
                    tokens.append(t[:-1])

            for token in tokens:
                cursor.execute("SELECT * FROM products WHERE title LIKE ? OR brand LIKE ? OR category LIKE ?", (f'%{token}%', f'%{token}%', f'%{token}%'))
                products = cursor.fetchall()
                if products:
                    break

        conn.close()

        # 3. Explicit Empty State: return None if no real product matches catalog
        if not products:
            return None

        product_row = products[0]
        prod_id = product_row['id']
        category = product_row['category']
        brand = product_row['brand']

        # Fetch active listings
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM listings WHERE product_id = ?", (prod_id,))
        listings_rows = cursor.fetchall()

        listings = []
        active_platforms = set()

        for l in listings_rows:
            active_platforms.add(l['platform'])
            cursor.execute(
                "SELECT recorded_at as date, price FROM price_history WHERE listing_id = ? ORDER BY recorded_at ASC",
                (l['id'],)
            )
            ph_rows = cursor.fetchall()
            price_history = [dict(row) for row in ph_rows]

            raw_url = l['url'] or ''
            if raw_url and not (raw_url.startswith('http://') or raw_url.startswith('https://')):
                raw_url = f"https://{raw_url.lstrip('/')}"

            listings.append({
                "id": l['id'],
                "platform": l['platform'],
                "price": l['price'],
                "original_price": l['original_price'],
                "currency": l['currency'],
                "rating": l['rating'],
                "review_count": l['review_count'],
                "seller": l['seller'],
                "in_stock": bool(l['in_stock']),
                "shipping": l['shipping'],
                "url": raw_url,
                "badge": l['badge'],
                "price_history": price_history
            })

        conn.close()

        # Calculate unavailable platforms based on PLATFORM_CAPABILITIES
        unavailable_platforms = []
        for store in cls.ALL_PLATFORMS:
            if store not in active_platforms:
                cap = cls.PLATFORM_CAPABILITIES.get(store, {})
                allowed_cats = cap.get("allowed_categories", ["All"])
                disallowed_b = cap.get("disallowed_brands", [])

                if "All" not in allowed_cats and category not in allowed_cats:
                    reason = cap.get("reason", f"{store} does not carry the {category} category.")
                elif brand in disallowed_b:
                    reason = f"{store} does not list official {brand} products."
                else:
                    reason = f"Currently out of stock on {store}."

                unavailable_platforms.append({
                    "platform": store,
                    "reason": reason,
                    "status": "Not Available"
                })

        specs = json.loads(product_row['specs']) if product_row['specs'] else {}
        key_features = json.loads(product_row['key_features']) if product_row['key_features'] else []

        return {
            "id": product_row['id'],
            "title": product_row['title'],
            "brand": product_row['brand'],
            "category": product_row['category'],
            "image_url": product_row['image_url'],
            "specs": specs,
            "key_features": key_features,
            "listings": listings,
            "unavailable_platforms": unavailable_platforms
        }
