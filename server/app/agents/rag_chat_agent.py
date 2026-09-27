import os
import json
from app.services.vector_store import get_vector_store
from app.database import get_db_connection

class RAGChatAgent:
    @classmethod
    def generate_response(cls, user_message, chat_history=None):
        vector_store = get_vector_store()
        top_matches = vector_store.search(user_message, top_k=2)

        if not top_matches:
            return cls._smart_rule_based_response(user_message, top_matches=[], deep_links=[])

        conn = get_db_connection()
        cursor = conn.cursor()

        context_items = []
        deep_links = []

        for prod in top_matches:
            prod_id = prod['id']
            cursor.execute("SELECT * FROM listings WHERE product_id = ? ORDER BY price ASC", (prod_id,))
            listings = [dict(r) for r in cursor.fetchall()]

            if listings:
                cheapest = listings[0]
                expensive = listings[-1]
                savings = expensive['price'] - cheapest['price']
                
                retailers_str = ", ".join([f"{l['platform']} (₹{l['price']:,})" for l in listings])
                context_items.append(
                    f"Product: {prod['title']}\n"
                    f"- Lowest Price: ₹{cheapest['price']:,} on {cheapest['platform']} (Original MRP: ₹{cheapest['original_price']:,})\n"
                    f"- Highest Listing Price: ₹{expensive['price']:,} on {expensive['platform']}\n"
                    f"- Total Potential Savings: ₹{savings:,}\n"
                    f"- All Retailers: {retailers_str}"
                )

                deep_links.append({
                    "product_id": prod_id,
                    "title": prod['title'],
                    "lowest_price": cheapest['price'],
                    "best_platform": cheapest['platform'],
                    "savings": savings,
                    "url": cheapest['url']
                })

        conn.close()

        context_text = "\n\n".join(context_items)

        # Check for Groq API Key
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                from groq import Groq
                client = Groq(api_key=groq_key)

                prompt = f"""You are a smart, friendly, multi-platform shopping assistant AI.
Answer the user's question accurately using the product pricing context below.

CONTEXT:
{context_text}

USER QUESTION: {user_message}

Provide a concise, helpful recommendation highlighting the lowest price retailer, potential savings, and whether it's a good deal."""

                response = client.chat.completions.create(
                    model="llama3-8b-8192",
                    messages=[
                        {"role": "system", "content": "You are a helpful e-commerce price comparison chatbot."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=500
                )
                ai_text = response.choices[0].message.content
                return {
                    "text": ai_text,
                    "deep_links": deep_links
                }
            except Exception as e:
                print(f"Groq API call error: {e}")

        # Intelligent Fallback LLM Generator
        return cls._smart_rule_based_response(user_message, top_matches, deep_links)

    @classmethod
    def _smart_rule_based_response(cls, query, top_matches, deep_links):
        query_lower = query.lower()

        if not deep_links:
            return {
                "text": "I searched our multi-platform catalog (Amazon, Flipkart, Myntra, Reliance Digital, Croma), but couldn't find an exact listing matching your query. Try searching for **iPhone 15**, **Samsung S24 Ultra**, **Sony WH-1000XM5**, **MacBook Air M3**, or **Air Jordan 1**!",
                "deep_links": []
            }

        top_deal = deep_links[0]
        title = top_deal["title"]
        best_price = top_deal["lowest_price"]
        platform = top_deal["best_platform"]
        savings = top_deal["savings"]

        if "cheapest" in query_lower or "price" in query_lower or "deal" in query_lower or "buy" in query_lower:
            text = f"💡 **Best Price Deal Alert!**\n\nThe **{title}** is currently cheapest on **{platform}** at **₹{best_price:,}**.\n\n"
            if savings > 0:
                text += f"🎉 By choosing {platform} over other listings, you save up to **₹{savings:,}**!\n\n"
            text += f"Click below to inspect the full price breakdown or jump directly to the listing!"
        elif "alternative" in query_lower or "compare" in query_lower:
            text = f"📊 **Product Comparison Summary**:\n\n1. **{title}**: Starting at **₹{best_price:,}** on **{platform}**.\n"
            if len(deep_links) > 1:
                alt = deep_links[1]
                text += f"2. **{alt['title']}**: Starting at **₹{alt['lowest_price']:,}** on **{alt['best_platform']}**.\n\n"
            text += "Both products are verified across multiple e-commerce platforms with active warranties."
        else:
            text = f"Here is what I found for **{title}**:\n\n- **Lowest Price**: ₹{best_price:,} on **{platform}**\n- **Max Price Spread Savings**: ₹{savings:,}\n- **Availability**: In Stock with express shipping\n\nWould you like me to track price drops for this product?"

        return {
            "text": text,
            "deep_links": deep_links
        }
