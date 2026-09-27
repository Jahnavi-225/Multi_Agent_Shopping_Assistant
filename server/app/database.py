import os
import json
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'shopping_agent.db')
SEED_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'seed_data.json')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_reseed=False):
    conn = get_db_connection()
    cursor = conn.cursor()

    if force_reseed:
        cursor.execute("DROP TABLE IF EXISTS price_history")
        cursor.execute("DROP TABLE IF EXISTS listings")
        cursor.execute("DROP TABLE IF EXISTS products")

    # Products Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            brand TEXT,
            category TEXT,
            image_url TEXT,
            specs TEXT,
            key_features TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Listings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS listings (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            price REAL NOT NULL,
            original_price REAL NOT NULL,
            currency TEXT DEFAULT '₹',
            rating REAL,
            review_count INTEGER,
            seller TEXT,
            in_stock BOOLEAN DEFAULT 1,
            shipping TEXT,
            url TEXT,
            badge TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        )
    ''')

    # Price History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_id TEXT NOT NULL,
            price REAL NOT NULL,
            recorded_at TEXT NOT NULL,
            FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
        )
    ''')

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            provider TEXT DEFAULT 'guest',
            avatar_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Watchlist / Alerts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS watchlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            target_price REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ''')

    # API Usage Tracking Table (Monthly quotas for external APIs)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_usage (
            month_year TEXT PRIMARY KEY,
            request_count INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()

    # Seed Database if products table is empty or force_reseed is True
    cursor.execute('SELECT COUNT(*) FROM products')
    count = cursor.fetchone()[0]
    if (count == 0 or force_reseed) and os.path.exists(SEED_DATA_PATH):
        with open(SEED_DATA_PATH, 'r', encoding='utf-8') as f:
            seed_data = json.load(f)

        for prod in seed_data:
            cursor.execute(
                'INSERT OR REPLACE INTO products (id, title, brand, category, image_url, specs, key_features) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (
                    prod['id'],
                    prod['title'],
                    prod.get('brand', ''),
                    prod.get('category', ''),
                    prod.get('image_url', ''),
                    json.dumps(prod.get('specs', {})),
                    json.dumps(prod.get('key_features', []))
                )
            )

            for item in prod.get('listings', []):
                cursor.execute(
                    '''INSERT OR REPLACE INTO listings 
                       (id, product_id, platform, price, original_price, currency, rating, review_count, seller, in_stock, shipping, url, badge)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                    (
                        item['id'],
                        prod['id'],
                        item['platform'],
                        item['price'],
                        item['original_price'],
                        item.get('currency', '₹'),
                        item.get('rating', 4.5),
                        item.get('review_count', 100),
                        item.get('seller', ''),
                        1 if item.get('in_stock', True) else 0,
                        item.get('shipping', 'Free Delivery'),
                        item['url'],
                        item.get('badge', '')
                    )
                )

                for ph in item.get('price_history', []):
                    cursor.execute(
                        'INSERT INTO price_history (listing_id, price, recorded_at) VALUES (?, ?, ?)',
                        (item['id'], ph['price'], ph['date'])
                    )

        conn.commit()
    conn.close()

def get_monthly_api_count(provider="rapidapi"):
    month_year = datetime.now().strftime("%Y-%m")
    key = f"{provider}_{month_year}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT request_count FROM api_usage WHERE month_year = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row['request_count'] if row else 0

def increment_monthly_api_count(provider="rapidapi"):
    month_year = datetime.now().strftime("%Y-%m")
    key = f"{provider}_{month_year}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO api_usage (month_year, request_count, updated_at)
        VALUES (?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(month_year) DO UPDATE SET
            request_count = request_count + 1,
            updated_at = CURRENT_TIMESTAMP
    ''', (key,))
    conn.commit()
    conn.close()

