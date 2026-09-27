class RankingDealAgent:
    @classmethod
    def analyze_and_rank(cls, product_data):
        if not product_data or "listings" not in product_data:
            return product_data

        listings = product_data["listings"]
        if not listings:
            return product_data

        # Calculate metrics for each listing
        min_price = min(l["price"] for l in listings)
        max_price = max(l["price"] for l in listings)
        price_spread = max_price - min_price

        ranked_listings = []

        for listing in listings:
            price = float(listing["price"])
            orig_price = float(listing.get("original_price", price))
            discount_pct = round(((orig_price - price) / orig_price) * 100) if orig_price > price else 0
            savings = orig_price - price

            # Deal score calculation (0 - 100 scale)
            if price_spread > 0:
                price_score = 50 * (1 - (price - min_price) / price_spread)
            else:
                price_score = 50

            discount_score = min(25, (discount_pct / 50) * 25)
            rating = float(listing.get("rating", 4.0))
            rating_score = (rating / 5.0) * 15
            stock_score = 5 if listing.get("in_stock", True) else 0
            shipping_score = 5 if "Free" in listing.get("shipping", "") else 2

            total_deal_score = min(100, round(price_score + discount_score + rating_score + stock_score + shipping_score))

            listing_copy = dict(listing)
            listing_copy["discount_percent"] = discount_pct
            listing_copy["savings"] = savings
            listing_copy["deal_score"] = total_deal_score
            listing_copy["is_lowest_price"] = (price == min_price)

            ranked_listings.append(listing_copy)

        # Sort listings by price ascending
        ranked_listings.sort(key=lambda x: float(x["price"]))

        # Assign smart badges
        for i, listing in enumerate(ranked_listings):
            if i == 0:
                listing["badge"] = "Lowest Price / Best Deal"
            elif listing["discount_percent"] == max(l["discount_percent"] for l in ranked_listings) and listing["discount_percent"] > 0:
                listing["badge"] = "Highest Discount"
            elif listing["rating"] == max(l["rating"] for l in ranked_listings):
                listing["badge"] = "Top Retailer Rating"

        product_data["listings"] = ranked_listings
        product_data["lowest_price"] = min_price
        product_data["highest_price"] = max_price
        product_data["max_savings"] = max_price - min_price

        return product_data
