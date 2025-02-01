const backendUrl = "https://tabetabi.onrender.com/api/restaurants"; // Update with your backend URL
let map;
let markers = [];
let openInfoWindow = null; // Track the currently open info window

// Initialize the Google Map
window.initMap = function () {
    console.log("Initializing map...");

    // Set the initial map center to the hotel location
    const hotelLocation = { lat: -36.84830052813565, lng: 174.76369793295038 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: hotelLocation,
        zoom: 15,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#f5f5f5" }],
            },
            {
                featureType: "landscape",
                elementType: "geometry",
                stylers: [{ color: "#eaeaea" }],
            },
        ],
    });
    console.log("Map initialized successfully!");

    // Create a marker for the hotel
    const hotelMarker = new google.maps.Marker({
        position: hotelLocation,
        map: map,
        title: "Hotel",
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Blue marker for the hotel
        },
    });
    console.log("Hotel marker added.");
};

// Listen for the search form submission
document.getElementById("searchForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent page refresh

    const cuisine = document.getElementById("cuisine").value;
    const budget = document.getElementById("budget").value;

    // Encode parameters to handle special characters
    const encodedCuisine = encodeURIComponent(cuisine);
    const encodedBudget = encodeURIComponent(budget);

    fetch(`${backendUrl}?cuisine=${encodedCuisine}&budget=${encodedBudget}`)
        .then((response) => response.json())
        .then((data) => {
            console.log("Full API Response:", data);

            if (!data || data.length === 0) {
                console.log("No results found.");
                document.getElementById("results").innerHTML = "<p>該当するレストランが見つかりませんでした。</p>";
                return;
            }

            displayResults(data);
        })
        .catch((error) => console.error("Error fetching restaurant data:", error));
});

// Function to display restaurant search results and update map markers
function displayResults(restaurants) {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ""; // Clear previous results

    if (!restaurants || restaurants.length === 0) {
        resultsContainer.innerHTML = "<p>該当するレストランが見つかりませんでした。</p>";
        return;
    }

    console.log("Displaying results:", restaurants);

    // Clear old markers from the map
    markers.forEach((marker) => marker.setMap(null));
    markers = [];

    restaurants.forEach((restaurant) => {
        // Create a result item element for each restaurant
        const restaurantElement = document.createElement("div");
        restaurantElement.classList.add("result-item");

        // Convert price level to money bag symbols (or "不明" if unavailable)
        const priceIcons = restaurant.price_level ? "💰".repeat(restaurant.price_level) : "不明";

        restaurantElement.innerHTML = `
            <h3>${restaurant.name}</h3>
            <p>評価: ${restaurant.rating || "なし"} ⭐</p>
            <p>住所: ${restaurant.vicinity || "不明"}</p>
            <p>価格レベル: ${priceIcons}</p>
            ${
                restaurant.website
                    ? `<p><a href="${restaurant.website}" target="_blank">公式ウェブサイト</a></p>`
                    : "<p>ウェブサイト情報なし</p>"
            }
            <a href="https://www.google.com/maps/search/?api=1&query=${restaurant.geometry?.location?.lat},${restaurant.geometry?.location?.lng}" target="_blank">Googleマップで見る</a>
        `;
        resultsContainer.appendChild(restaurantElement);

        // Create a marker for the restaurant on the map
        const marker = new google.maps.Marker({
            position: {
                lat: restaurant.geometry.location.lat,
                lng: restaurant.geometry.location.lng,
            },
            map: map,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png", // Orange marker for restaurants
            },
        });

        // Create an info window for the restaurant
        const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${restaurant.name}</strong>`,
        });

        // Set up the marker click event to open its info window
        marker.addListener("click", () => {
            if (openInfoWindow) {
                openInfoWindow.close(); // Close any previously open info window
            }
            infoWindow.open(map, marker);
            openInfoWindow = infoWindow;
        });

        // When a result is clicked, center the map on its marker and trigger the marker's click event
        restaurantElement.addEventListener("click", () => {
            map.setCenter(marker.getPosition());
            google.maps.event.trigger(marker, "click");
        });

        // Save the marker for potential later removal
        markers.push(marker);
    });
}
