import 'dotenv/config';
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Set the hotel's coordinates as the search center
const latitude = -36.84835337803283; // Replace with actual hotel latitude -36.84835337803283, 174.76375076793175
const longitude = 174.76375076793175; // Replace with actual hotel longitude
const radius = 800; // Search radius in meters (1km)

// Function to fetch additional details for each restaurant (website, price level)
async function getRestaurantDetails(placeId) {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,price_level&key=${GOOGLE_PLACES_API_KEY}`;

    try {
        const response = await fetch(detailsUrl);
        const data = await response.json();
        return data.result || {};
    } catch (error) {
        console.error("Error fetching place details:", error);
        return {};
    }
}

// Route to fetch restaurant data
app.get("/api/restaurants", async (req, res) => {
    try {
        console.log("Received restaurant request:", req.query);

        let { cuisine, budget } = req.query;
        let minPrice, maxPrice;
        let searchKeywords = cuisine; // Default to the selected cuisine

        // Convert user budget selection to Google's price level format
        if (budget === "low") { minPrice = 1; maxPrice = 1; }
        else if (budget === "medium") { minPrice = 2; maxPrice = 2; }
        else { minPrice = 3; maxPrice = 4; }

        // Special case: If searching for "sweets," adjust search keywords
        if (cuisine === "sweets") {
            searchKeywords = "chocolate, ice cream, gelato, dessert, sweets, milkshake, cake, cafe";
        }

        console.log(`Fetching restaurants for cuisine: ${cuisine} (search term: ${searchKeywords}), price range: ${minPrice}-${maxPrice}`);

        // Google Places API Nearby Search URL
        const googleApiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&keyword=${searchKeywords}&minprice=${minPrice}&maxprice=${maxPrice}&key=${GOOGLE_PLACES_API_KEY}`;

        const response = await fetch(googleApiUrl);
        const data = await response.json();

        if (!data.results) {
            console.error("Google API response missing results:", data);
            return res.status(500).json({ error: "Failed to fetch restaurant data from Google" });
        }

        let results = data.results.slice(0, 15); // Limit results to 6 restaurants
        console.log(`Fetched ${results.length} restaurants`);

        // Fetch additional details for each restaurant (website & price level)
        for (let i = 0; i < results.length; i++) {
            try {
                console.log(`Fetching details for place_id: ${results[i].place_id}`);
                const details = await getRestaurantDetails(results[i].place_id);
                results[i].website = details.website || null;
                results[i].price_level = details.price_level !== undefined ? details.price_level : null;
            } catch (error) {
                console.error(`Error fetching details for ${results[i].name}:`, error);
            }
        }

        // Filter out restaurants without a website
        const filteredResults = results.filter(restaurant => restaurant.website);

        console.log(`Final filtered results (only with websites):`, JSON.stringify(filteredResults, null, 2));

        res.json(filteredResults);
    } catch (error) {
        console.error("Unexpected error in /api/restaurants:", error);
        res.status(500).json({ error: "Server encountered an error" });
    }
});

// Start the backend server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
