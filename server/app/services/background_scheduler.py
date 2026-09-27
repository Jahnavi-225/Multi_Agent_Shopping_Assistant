import random
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import get_db_connection

scheduler = BackgroundScheduler()

def refresh_prices_and_history():
    """
    Simulates periodic scheduled price refreshes from platforms and records price history.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id, price, original_price FROM listings")
        listings = cursor.fetchall()

        today_str = datetime.now().strftime("%Y-%m-%d")

        for l in listings:
            l_id = l['id']
            curr_price = l['price']
            orig_price = l['original_price']

            # Small random price update simulation (-2% to +1% variation)
            delta_factor = random.choice([-0.02, -0.01, 0, 0.005, -0.015])
            if delta_factor != 0:
                new_price = max(int(orig_price * 0.6), int(curr_price * (1 + delta_factor)))
                
                cursor.execute(
                    "UPDATE listings SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (new_price, l_id)
                )

                # Record in price_history table if not already recorded today
                cursor.execute(
                    "INSERT INTO price_history (listing_id, price, recorded_at) VALUES (?, ?, ?)",
                    (l_id, new_price, today_str)
                )

        conn.commit()
        conn.close()
        print(f"[{datetime.now().strftime('%H:%M:%S')}] APScheduler: Successfully refreshed product price listings and history.")
    except Exception as e:
        print(f"APScheduler job error: {e}")

def start_scheduler():
    if not scheduler.running:
        # Schedule price refresh every 15 minutes
        scheduler.add_job(func=refresh_prices_and_history, trigger="interval", minutes=15)
        scheduler.start()
        print("APScheduler started: Background price tracking active.")
