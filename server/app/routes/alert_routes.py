from flask import Blueprint, request, jsonify
from app.database import get_db_connection

alert_bp = Blueprint('alerts', __name__)

@alert_bp.route('/watchlist', methods=['GET', 'POST'])
def watchlist_handler():
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        data = request.get_json() or {}
        user_id = data.get('user_id', 'demo-user')
        product_id = data.get('product_id', '')
        target_price = data.get('target_price', 0)

        if not product_id:
            conn.close()
            return jsonify({"error": "product_id is required"}), 400

        cursor.execute(
            "INSERT INTO watchlist (user_id, product_id, target_price) VALUES (?, ?, ?)",
            (user_id, product_id, target_price)
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "Product added to price drop watchlist!"})

    # GET request
    user_id = request.args.get('user_id', 'demo-user')
    cursor.execute('''
        SELECT w.id as watchlist_id, w.target_price, w.created_at, p.id as product_id, p.title, p.brand, p.image_url,
               (SELECT MIN(price) FROM listings WHERE product_id = p.id) as current_lowest_price
        FROM watchlist w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id = ?
    ''', (user_id,))

    rows = cursor.fetchall()
    conn.close()

    items = [dict(r) for r in rows]
    return jsonify({"status": "success", "watchlist": items})

@alert_bp.route('/watchlist/<int:watchlist_id>', methods=['DELETE'])
def remove_watchlist(watchlist_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM watchlist WHERE id = ?", (watchlist_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Removed from watchlist"})
