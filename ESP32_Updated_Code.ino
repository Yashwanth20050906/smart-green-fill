#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase Edge Function URL - Replace with your actual URL
const String serverURL = "https://YOUR_PROJECT_ID.supabase.co/functions/v1/update-bin-data";

// Sensor pins and configuration
struct Sensor {
  int trigPin;
  int echoPin;
  String binType;
  float binHeight; // in cm
};

// Define sensors for each bin
Sensor sensors[] = {
  {2, 3, "dry", 30.0},    // Dry waste bin
  {4, 5, "wet", 30.0},    // Wet waste bin  
  {6, 7, "metal", 30.0}   // Metal waste bin
};

const int numSensors = sizeof(sensors) / sizeof(sensors[0]);

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor pins
  for (int i = 0; i < numSensors; i++) {
    pinMode(sensors[i].trigPin, OUTPUT);
    pinMode(sensors[i].echoPin, INPUT);
  }
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read all sensors and send data
    for (int i = 0; i < numSensors; i++) {
      float distance = readUltrasonicSensor(sensors[i].trigPin, sensors[i].echoPin);
      
      if (distance > 0 && distance < 400) { // Valid reading range
        sendBinData(sensors[i].binType, distance, sensors[i].binHeight);
        delay(1000); // Small delay between sensor readings
      } else {
        Serial.println("Invalid reading for " + sensors[i].binType + " bin");
      }
    }
  } else {
    Serial.println("WiFi disconnected, attempting to reconnect...");
    WiFi.begin(ssid, password);
  }
  
  // Wait 30 seconds before next reading cycle
  delay(30000);
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

void sendBinData(String binType, float distance, float binHeight) {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", "YOUR_SUPABASE_ANON_KEY"); // Add your Supabase anon key
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["bin_type"] = binType;
  doc["distance_cm"] = distance;
  doc["bin_height_cm"] = binHeight;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Sending data for " + binType + " bin:");
  Serial.println("Distance: " + String(distance) + " cm");
  Serial.println("JSON: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    if (httpResponseCode == 200) {
      Serial.println("✓ Data sent successfully for " + binType + " bin");
    }
  } else {
    Serial.println("✗ Error sending data for " + binType + " bin");
    Serial.println("Error code: " + String(httpResponseCode));
  }
  
  http.end();
}

/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Install Arduino IDE and add ESP32 board support
 * 2. Install required libraries:
 *    - WiFi (built-in)
 *    - HTTPClient (built-in) 
 *    - ArduinoJson (install from Library Manager)
 * 
 * 3. Update the following variables:
 *    - ssid: Your WiFi network name
 *    - password: Your WiFi password
 *    - serverURL: Your Supabase Edge Function URL
 *    - YOUR_SUPABASE_ANON_KEY: Your Supabase anonymous key
 * 
 * 4. Wire the ultrasonic sensors:
 *    Dry Bin:   Trig=Pin2, Echo=Pin3
 *    Wet Bin:   Trig=Pin4, Echo=Pin5  
 *    Metal Bin: Trig=Pin6, Echo=Pin7
 * 
 * 5. Upload code to ESP32
 * 
 * 6. Monitor Serial output to verify data transmission
 */