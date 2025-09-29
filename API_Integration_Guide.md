# Smart Waste Management API Integration Guide

## Overview
Your waste management system now has a complete backend API powered by Supabase with real-time data synchronization.

## 🚀 What's Been Created

### 1. Database Schema (`bins` table)
- **bin_type**: 'dry', 'wet', or 'metal'
- **fill_level**: Percentage (0-100)
- **status**: 'empty', 'low', 'medium', 'high', 'full'
- **distance_cm**: Raw sensor reading
- **bin_height_cm**: Bin height for calculations
- **last_updated**: Timestamp of last update

### 2. Supabase Edge Function (`update-bin-data`)
**Endpoint**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/update-bin-data`

#### POST Request (Update bin data from ESP32)
```json
{
  "bin_type": "dry",
  "distance_cm": 15.5,
  "bin_height_cm": 30.0
}
```

#### GET Request (Fetch all bin data)
Returns all bin data with calculated fill levels and status.

### 3. Real-time Dashboard
- Connects to Supabase database
- Real-time updates when ESP32 sends data
- Shows connection status and last update time

## 📡 ESP32 Integration

### Hardware Setup
```
Dry Bin Sensor:   Trig=Pin2, Echo=Pin3
Wet Bin Sensor:   Trig=Pin4, Echo=Pin5  
Metal Bin Sensor: Trig=Pin6, Echo=Pin7
```

### Configuration Steps

1. **Get Supabase Credentials**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon/public key

2. **Update ESP32 Code**
   Open `ESP32_Updated_Code.ino` and update:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const String serverURL = "https://YOUR_PROJECT_ID.supabase.co/functions/v1/update-bin-data";
   // In the sendBinData function:
   http.addHeader("apikey", "YOUR_SUPABASE_ANON_KEY");
   ```

3. **Upload to ESP32**
   - Install required libraries: ArduinoJson
   - Upload the code to your ESP32
   - Monitor serial output for debugging

## 🔧 API Endpoints

### Update Bin Data
```http
POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/update-bin-data
Content-Type: application/json
apikey: YOUR_SUPABASE_ANON_KEY

{
  "bin_type": "dry",
  "distance_cm": 15.5,
  "bin_height_cm": 30.0
}
```

### Get All Bins
```http
GET https://YOUR_PROJECT_ID.supabase.co/functions/v1/update-bin-data
apikey: YOUR_SUPABASE_ANON_KEY
```

## 📊 Data Flow

1. **ESP32 Sensors** → Read ultrasonic distance
2. **ESP32** → Send POST request to Supabase Edge Function
3. **Edge Function** → Calculate fill level and status
4. **Database** → Store updated bin data
5. **Frontend** → Real-time updates via Supabase subscription

## 🔍 Testing the API

### Test with curl:
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/update-bin-data \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "bin_type": "dry",
    "distance_cm": 10.5,
    "bin_height_cm": 30.0
  }'
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "bin_type": "dry",
    "fill_level": 65.0,
    "status": "medium",
    "distance_cm": 10.5
  },
  "message": "dry bin updated: 65% full (medium)"
}
```

## 🚨 Monitoring & Alerts

The system automatically:
- Calculates fill levels from sensor readings
- Determines bin status (empty/low/medium/high/full)
- Updates compliance score in real-time
- Shows connection status on dashboard

## 🔒 Security Features

- CORS headers for web requests
- Input validation for all data
- Row Level Security enabled
- API key authentication

## 🛠 Troubleshooting

### Common Issues:
1. **ESP32 not connecting**: Check WiFi credentials
2. **Data not updating**: Verify Supabase URL and API key
3. **CORS errors**: Edge function includes proper CORS headers
4. **Invalid readings**: Check ultrasonic sensor wiring

### Debug Steps:
1. Check ESP32 serial monitor for error messages
2. Verify network connectivity
3. Test API endpoints with curl or Postman
4. Check Supabase logs in dashboard

## 📈 Next Steps

1. Set up email/SMS alerts for full bins
2. Add historical data analysis
3. Implement predictive filling patterns
4. Add multiple location support
5. Create mobile app for field workers

Your smart waste management system is now fully operational with real-time ESP32 integration!