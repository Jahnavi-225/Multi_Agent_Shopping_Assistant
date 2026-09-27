import json
import sqlite3
import numpy as np
from app.database import get_db_connection

SIMILARITY_THRESHOLD = 0.35

try:
    from sentence_transformers import SentenceTransformer
    MODEL = SentenceTransformer('all-MiniLM-L6-v2')
    HAS_ST = True
except Exception:
    MODEL = None
    HAS_ST = False

class LocalVectorStore:
    def __init__(self):
        self.embeddings_cache = {}
        self.products_index = []
        self.load_and_index()

    def _get_embedding(self, text):
        if HAS_ST and MODEL:
            return MODEL.encode(text)
        
        # Fallback simple bag-of-words vectorizer for zero-dependency reliability
        words = text.lower().split()
        vector = np.zeros(128)
        for w in words:
            idx = sum(ord(c) for c in w) % 128
            vector[idx] += 1
        norm = np.linalg.norm(vector)
        return vector / norm if norm > 0 else vector

    def load_and_index(self):
        if HAS_ST and MODEL:
            print("Vector store using: sentence-transformers")
        else:
            print("Vector store using: fallback bag-of-words")

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, brand, category, specs, key_features FROM products")
        rows = cursor.fetchall()

        self.products_index = []
        for r in rows:
            prod_id = r['id']
            title = r['title']
            brand = r['brand'] or ''
            cat = r['category'] or ''
            specs = json.loads(r['specs']) if r['specs'] else {}
            features = json.loads(r['key_features']) if r['key_features'] else []

            specs_text = " ".join([f"{k}: {v}" for k, v in specs.items()])
            features_text = " ".join(features)
            combined_text = f"{brand} {cat} {title} {specs_text} {features_text}"

            vec = self._get_embedding(combined_text)

            # Get lowest price listing
            cursor.execute("SELECT MIN(price) as min_price, platform FROM listings WHERE product_id = ?", (prod_id,))
            l_row = cursor.fetchone()
            lowest_price = l_row['min_price'] if l_row else 0
            best_platform = l_row['platform'] if l_row else ''

            self.products_index.append({
                "id": prod_id,
                "title": title,
                "brand": brand,
                "category": cat,
                "lowest_price": lowest_price,
                "best_platform": best_platform,
                "text": combined_text,
                "vector": vec
            })

        conn.close()

    def search(self, query, top_k=3):
        if not self.products_index:
            self.load_and_index()

        q_vec = self._get_embedding(query)
        results = []

        for prod in self.products_index:
            p_vec = prod["vector"]
            similarity = float(np.dot(q_vec, p_vec) / (np.linalg.norm(q_vec) * np.linalg.norm(p_vec) + 1e-8))
            if similarity >= SIMILARITY_THRESHOLD:
                results.append((similarity, prod))

        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1] for r in results[:top_k]]

# Global Vector Store Singleton
vector_store_instance = None

def get_vector_store():
    global vector_store_instance
    if vector_store_instance is None:
        vector_store_instance = LocalVectorStore()
    return vector_store_instance

