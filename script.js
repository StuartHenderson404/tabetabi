const backendUrl = "http://localhost:3001/api/restaurants"; // Update with your backend URL
let map;
let markers = [];
let openInfoWindow = null; // Track the currently open info window

window.initMap = function () {
    console.log("Initializing map...");

    // Set the initial map center to the hotel location
    const hotelLocation = { lat: -36.84830052813565, lng: 174.76369793295038 }; // Replace with actual hotel coordinates -36.84830052813565, 174.76369793295038

    map = new google.maps.Map(document.getElementById("map"), {
        center: hotelLocation,
        zoom: 15,
        mapId: "YOUR_MAP_ID",
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

    // Create a hotel marker with a label
    const hotelMarker = new google.maps.Marker({
        position: hotelLocation,
        map: map,
        title: "Hotel",
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Blue pin for the hotel
        },
    });

    console.log("Hotel marker added.");
};

// Event listener for search form submission
document.getElementById("searchForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent page refresh

    const cuisine = document.getElementById("cuisine").value;
    const budget = document.getElementById("budget").value;

    // Fetch restaurant data from the backend
    fetch(`${backendUrl}?cuisine=${cuisine}&budget=${budget}`)
        .then(response => response.json())
        .then(data => {
            console.log("Full API Response:", data);

            if (!data || data.length === 0) {
                console.log("No results found.");
                document.getElementById("results").innerHTML = "<p>該当するレストランが見つかりませんでした。</p>";
                return;
            }

            displayResults(data);
        })
        .catch(error => console.error("Error fetching restaurant data:", error));
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

    // Clear old markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    restaurants.forEach(restaurant => {
        const restaurantElement = document.createElement("div");
        restaurantElement.classList.add("result-item");

        // Convert price level to money bag symbols
        const priceIcons = restaurant.price_level ? "💰".repeat(restaurant.price_level) : "不明";

        restaurantElement.innerHTML = `
            <h3>${restaurant.name}</h3>
            <p>評価: ${restaurant.rating || "なし"} ⭐</p>
            <p>住所: ${restaurant.vicinity || "不明"}</p>
            <p>価格レベル: ${priceIcons}</p>
            ${restaurant.website ? `<p><a href="${restaurant.website}" target="_blank">公式ウェブサイト</a></p>` : "<p>ウェブサイト情報なし</p>"}
            <a href="https://www.google.com/maps/search/?api=1&query=${restaurant.geometry?.location?.lat},${restaurant.geometry?.location?.lng}" target="_blank">Googleマップで見る</a>
        `;

        resultsContainer.appendChild(restaurantElement);

        // Add restaurant markers with click-to-show name
        const marker = new google.maps.Marker({
            position: {
                lat: restaurant.geometry.location.lat,
                lng: restaurant.geometry.location.lng,
            },
            map: map,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png", // Orange pin for visibility
            },
        });

        // Create an info window with the restaurant name
        const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${restaurant.name}</strong>`,
        });

        // Add click event to open the info window and close the previous one
        marker.addListener("click", () => {
            if (openInfoWindow) {
                openInfoWindow.close(); // Close the previously open info window
            }
            infoWindow.open(map, marker);
            openInfoWindow = infoWindow; // Store the new open info window
        });

        markers.push(marker);
    });

    // Center the map on the first restaurant if results exist
    if (restaurants.length > 0) {
        map.setCenter({
            lat: restaurants[0].geometry.location.lat,
            lng: restaurants[0].geometry.location.lng,
        });
    }
}
