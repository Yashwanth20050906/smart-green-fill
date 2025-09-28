# ESP32 Integration Guide for Smart Waste Management System

## Overview
This guide provides step-by-step instructions to integrate your ESP32 microcontroller with the Smart Waste Management dashboard for real-time bin monitoring.

## Hardware Requirements
- ESP32 development board
- 3x Ultrasonic sensors (HC-SR04) for distance measurement
- Jumper wires
- Breadboard
- Power supply (5V recommended)

## Wiring Diagram

### Bin 1 (Dry Waste) - HC-SR04
- VCC → 5V
- GND → GND
- Trig → GPIO 2
- Echo → GPIO 4

### Bin 2 (Wet Waste) - HC-SR04
- VCC → 5V
- GND → GND
- Trig → GPIO 5
- Echo → GPIO 18

### Bin 3 (Metal Waste) - HC-SR04
- VCC → 5V
- GND → GND
- Trig → GPIO 19
- Echo → GPIO 21

## ESP32 Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server endpoint (replace with your backend URL)
const char* serverURL = "http://your-backend-url.com/api/bins";

// Ultrasonic sensor pins
struct Sensor {
  int trigPin;
  int echoPin;
  String binType;
  int binHeight; // Total bin height in cm
};

Sensor sensors[3] = {
  {2, 4, "dry", 50},    // Dry waste bin
  {5, 18, "wet", 50},   // Wet waste bin
  {19, 21, "metal", 50} // Metal waste bin
};

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor pins
  for (int i = 0; i < 3; i++) {
    pinMode(sensors[i].trigPin, OUTPUT);
    pinMode(sensors[i].echoPin, INPUT);
  }
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read all sensors
    for (int i = 0; i < 3; i++) {
      float distance = readUltrasonicSensor(sensors[i].trigPin, sensors[i].echoPin);
      int fillLevel = calculateFillLevel(distance, sensors[i].binHeight);
      String status = determineBinStatus(fillLevel);
      
      // Send data to server
      sendBinData(sensors[i].binType, fillLevel, status);
      
      delay(100); // Small delay between sensors
    }
  }
  
  delay(5000); // Update every 5 seconds
}

float readUltrasonicSensor(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2; // Convert to cm
  
  return distance;
}

int calculateFillLevel(float distance, int binHeight) {
  // Subtract 5cm for sensor mounting clearance
  int usableHeight = binHeight - 5;
  int fillLevel = 100 - ((distance / usableHeight) * 100);
  
  // Constrain to 0-100%
  if (fillLevel < 0) fillLevel = 0;
  if (fillLevel > 100) fillLevel = 100;
  
  return fillLevel;
}

String determineBinStatus(int fillLevel) {
  if (fillLevel >= 95) return "full";
  if (fillLevel >= 80) return "warning";
  return "normal";
}

void sendBinData(String binType, int fillLevel, String status) {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["binType"] = binType;
  doc["fillLevel"] = fillLevel;
  doc["status"] = status;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error in HTTP request");
  }
  
  http.end();
}
```

## Backend API Integration

### 1. Create API Endpoint
You'll need to create a backend endpoint to receive ESP32 data. Here's an example using Node.js/Express:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let binData = {
  dry: { fillLevel: 0, status: 'normal', lastUpdate: new Date() },
  wet: { fillLevel: 0, status: 'normal', lastUpdate: new Date() },
  metal: { fillLevel: 0, status: 'normal', lastUpdate: new Date() }
};

// Receive data from ESP32
app.post('/api/bins', (req, res) => {
  const { binType, fillLevel, status } = req.body;
  
  if (binData[binType]) {
    binData[binType] = {
      fillLevel,
      status,
      lastUpdate: new Date()
    };
    
    console.log(`Updated ${binType} bin: ${fillLevel}% (${status})`);
    res.json({ success: true, message: 'Data updated' });
  } else {
    res.status(400).json({ error: 'Invalid bin type' });
  }
});

// Get current bin data (for frontend)
app.get('/api/bins', (req, res) => {
  res.json(binData);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Update Frontend to Use Real Data
Modify the Dashboard component to fetch real data:

```javascript
// In Dashboard.tsx, replace mock data with real API calls
useEffect(() => {
  const fetchBinData = async () => {
    try {
      const response = await fetch('http://your-backend-url.com/api/bins');
      const data = await response.json();
      
      const formattedData = Object.keys(data).map(type => ({
        type,
        fillLevel: data[type].fillLevel,
        status: data[type].status
      }));
      
      setBinData(formattedData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch bin data:', error);
      setIsConnected(false);
    }
  };

  fetchBinData();
  const interval = setInterval(fetchBinData, 5000);
  return () => clearInterval(interval);
}, []);
```

## Installation Steps

### 1. Arduino IDE Setup
1. Install Arduino IDE
2. Add ESP32 board support:
   - File → Preferences
   - Add URL: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

### 2. Required Libraries
Install these libraries via Arduino Library Manager:
- WiFi (built-in)
- HTTPClient (built-in)
- ArduinoJson

### 3. Upload Code
1. Connect ESP32 to computer via USB
2. Select correct board: "ESP32 Dev Module"
3. Select correct port
4. Upload the code

### 4. Deploy Backend
1. Deploy your backend API to a cloud service (Heroku, Vercel, etc.)
2. Update the `serverURL` in ESP32 code
3. Update the API endpoint in your frontend

## Troubleshooting

### Common Issues
1. **WiFi Connection Failed**: Check SSID/password
2. **HTTP Request Failed**: Verify server URL and network connectivity
3. **Sensor Reading Issues**: Check wiring and power supply
4. **CORS Errors**: Ensure backend has CORS enabled

### Debug Mode
Add this to your ESP32 code for debugging:
```cpp
#define DEBUG_MODE 1

#if DEBUG_MODE
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.print(" cm, Fill Level: ");
  Serial.print(fillLevel);
  Serial.println("%");
#endif
```

## Security Considerations
1. Use HTTPS for production
2. Implement API authentication
3. Add input validation
4. Use environment variables for sensitive data

## Next Steps
1. Add data logging and analytics
2. Implement push notifications for full bins
3. Add predictive maintenance features
4. Create mobile app for field workers

---

This integration will provide real-time monitoring of your waste bins with automatic updates to the dashboard!