import React, { useEffect, useState } from "react";
import InfusionCard from "./components/InfusionCard/InfusionCard";

const API_URL = "https://ungrinned-amphibiously-angelique.ngrok-free.dev/api/data/";

// ----------------------
// Process API data: Group by bottle_id and get latest entry per bottle
function processApiData(apiData) {
  if (!apiData || !Array.isArray(apiData)) return {};

  // Group by bottle_id
  const bottlesMap = {};
  
  apiData.forEach((entry) => {
    const bottleId = entry.bottle_id;
    
    // If bottle doesn't exist or this entry has a newer timestamp
    if (!bottlesMap[bottleId] || entry.timestamp > bottlesMap[bottleId].timestamp) {
      bottlesMap[bottleId] = {
        bottle_id: entry.bottle_id,
        timestamp: entry.timestamp, // Unix timestamp in seconds
        current_level: entry.current_level,
        time_remaining: entry.time_remaining,
        infusion_rate: entry.infusion_rate, // ml/min from backend
        remaining_volume: entry.remaining_volume,
        fill_h: entry.fill_h,
        current_percentage: entry.current_percentage,
      };
    }
  });

  return bottlesMap;
}

// ----------------------
// Main App Component
function App() {
  const [bottles, setBottles] = useState([]);
  const [bottlesHistory, setBottlesHistory] = useState({}); // Track history for each bottle
  const [status, setStatus] = useState("Disconnected");
  const [graphType, setGraphType] = useState("remaining_volume"); // "remaining_volume" or "infusion_rate"

  // Fetch data from API
  const fetchData = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: {
          'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiData = await response.json();
      const processedBottles = processApiData(apiData);
      
      // Convert to array and track start_time for each bottle
      const bottlesArray = Object.values(processedBottles).map((bottle) => {
        // Get or set start_time for this bottle
        const existingBottle = bottles.find((b) => b.bottle_id === bottle.bottle_id);
        const startTime = existingBottle?.start_time || bottle.timestamp;
        
        return {
          ...bottle,
          start_time: startTime, // Keep original start time
        };
      });

      setBottles(bottlesArray);
      
      // Update history for each bottle
      setBottlesHistory((prevHistory) => {
        const newHistory = { ...prevHistory };
        
        bottlesArray.forEach((bottle) => {
          if (!newHistory[bottle.bottle_id]) {
            newHistory[bottle.bottle_id] = [];
          }
          
          // Add new data point
          newHistory[bottle.bottle_id].push({
            time: bottle.timestamp, // Unix timestamp in seconds
            remaining_volume: bottle.remaining_volume,
            infusion_rate: bottle.infusion_rate, // Already in ml/min
          });
          
          // Keep only last 50 points
          if (newHistory[bottle.bottle_id].length > 50) {
            newHistory[bottle.bottle_id] = newHistory[bottle.bottle_id].slice(-50);
          }
        });
        
        return newHistory;
      });
      
      setStatus("Connected");
    } catch (error) {
      console.error("Error fetching data:", error);
      setStatus("Disconnected");
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Poll API every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 2000);

    return () => clearInterval(interval);
  }, [bottles]); // Include bottles to access start_time

  return (
    <div className="p-6 font-sans bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Infusion Monitoring Dashboard
        </h1>
        <div
          className={`inline-block px-3 py-1.5 rounded-md text-sm font-medium text-white ${
            status === "Connected" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          Status: {status}
        </div>
      </div>

      {/* Graph Type Toggle - Top Right of Cards Section */}
      <div className="mb-4 flex justify-end">
        <div className="bg-white rounded-lg shadow-sm p-2 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Graph View:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setGraphType("remaining_volume")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                graphType === "remaining_volume"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Remaining Volume
            </button>
            <button
              onClick={() => setGraphType("infusion_rate")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                graphType === "infusion_rate"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Infusion Rate
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid - 2 per row */}
      {bottles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {status === "Disconnected" 
            ? "Unable to connect to server. Please check your connection."
            : "Loading bottle data..."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bottles.map((bottle) => (
            <InfusionCard
              key={`bottle-${bottle.bottle_id}`}
              data={bottle}
              history={bottlesHistory[bottle.bottle_id] || []}
              graphType={graphType}
            />
          ))}
        </div>
      )}

      {/* Low Volume Warning */}
      {bottles.some((b) => b.remaining_volume < 20 && b.remaining_volume > 0) && (
        <div className="mt-6 p-4 bg-red-500 text-white rounded-lg font-bold text-center text-base">
          ⚠ Low Fluid Level Detected! Please attend immediately.
        </div>
      )}
    </div>
  );
}

export default App;
