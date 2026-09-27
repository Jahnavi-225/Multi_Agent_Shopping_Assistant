import json
from flask import Blueprint, request, jsonify
from app.agents.product_identifier import ProductIdentifierAgent
from app.agents.scrapers import MultiPlatformScraperAgent
from app.agents.ranking_agent import RankingDealAgent
from app.services.vector_store import get_vector_store
from app.database import get_db_connection

product_bp = Blueprint('products', __name__)

@product_bp.route('/search', methods=['POST', 'GET'])
def search_products():
    if request.method == 'POST':
        data = request.get_json() or {}
        query = data.get('query', '')
    else:
        query = request.args.get('query', '')

    if not query:
        return jsonify({"error": "Search query or URL is required"}), 400

    # 1. Product Identifier Agent
    parsed_info = ProductIdentifierAgent.process_input(query)

    # 2. Scraper / Search Agent
    raw_product_data = MultiPlatformScraperAgent.search_and_scrape(parsed_info)

    if not raw_product_data:
        return jsonify({"status": "error", "message": f"No matching product listings found for '{query}'"}), 404

    # 3. Ranking & Deal Evaluator Agent
    ranked_product = RankingDealAgent.analyze_and_rank(raw_product_data)

    # 4. Product Discovery & Similar Products matching via Vector Store
    vector_store = get_vector_store()
    top_matches = vector_store.search(query, top_k=4)

    similar_products = []
    conn = get_db_connection()
    cursor = conn.cursor()

    for m in top_matches:
        if m['id'] != ranked_product['id']:
            cursor.execute("SELECT * FROM products WHERE id = ?", (m['id'],))
            p = cursor.fetchone()
            if p:
                cursor.execute("SELECT MIN(price) as min_price FROM listings WHERE product_id = ?", (m['id'],))
                min_price = cursor.fetchone()['min_price'] or 0

                similar_products.append({
                    "id": p['id'],
                    "title": p['title'],
                    "brand": p['brand'],
                    "category": p['category'],
                    "image_url": p['image_url'],
                    "lowest_price": min_price
                })

    conn.close()

    return jsonify({
        "status": "success",
        "parsed_info": parsed_info,
        "product": ranked_product,
        "similar_products": similar_products[:3]
    })

@product_bp.route('/compare/<product_id>', methods=['GET'])
def compare_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    prod_row = cursor.fetchone()

    if not prod_row:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    cursor.execute("SELECT * FROM listings WHERE product_id = ?", (product_id,))
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
            "url": l['url'],
            "badge": l['badge'],
            "price_history": price_history
        })

    conn.close()

    # Unavailable platforms logic
    category = prod_row['category']
    brand = prod_row['brand']
    unavailable_platforms = []

    for store in MultiPlatformScraperAgent.ALL_PLATFORMS:
        if store not in active_platforms:
            cap = MultiPlatformScraperAgent.PLATFORM_CAPABILITIES.get(store, {})
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

    raw_data = {
        "id": prod_row['id'],
        "title": prod_row['title'],
        "brand": prod_row['brand'],
        "category": prod_row['category'],
        "image_url": prod_row['image_url'],
        "specs": json.loads(prod_row['specs']) if prod_row['specs'] else {},
        "key_features": json.loads(prod_row['key_features']) if prod_row['key_features'] else [],
        "listings": listings,
        "unavailable_platforms": unavailable_platforms
    }

    ranked_data = RankingDealAgent.analyze_and_rank(raw_data)
    return jsonify({"status": "success", "product": ranked_data})

@product_bp.route('/featured', methods=['GET'])
def featured_products():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM products LIMIT 6")
    prod_rows = cursor.fetchall()

    featured_list = []
    for row in prod_rows:
        prod_id = row['id']
        cursor.execute("SELECT * FROM products WHERE id = ?", (prod_id,))
        p = cursor.fetchone()

        cursor.execute("SELECT * FROM listings WHERE product_id = ?", (prod_id,))
        l_rows = cursor.fetchall()

        listings = []
        for l in l_rows:
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
                "url": l['url'],
                "badge": l['badge']
            })

        raw_data = {
            "id": p['id'],
            "title": p['title'],
            "brand": p['brand'],
            "category": p['category'],
            "image_url": p['image_url'],
            "specs": json.loads(p['specs']) if p['specs'] else {},
            "key_features": json.loads(p['key_features']) if p['key_features'] else [],
            "listings": listings,
            "unavailable_platforms": []
        }

        ranked = RankingDealAgent.analyze_and_rank(raw_data)
        featured_list.append(ranked)

    conn.close()
    return jsonify({"status": "success", "featured": featured_list})
