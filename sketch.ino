#include <WiFi.h>
#include <DHT.h>
#include <HTTPClient.h>

#define DHTPIN 23        
#define DHTTYPE DHT22    
#define RELAY_PIN 22     

// Firebase REST Endpoint URL
const String FIREBASE_URL = "https://smart-agribox-2026-default-rtdb.asia-southeast1.firebasedatabase.app/AgriBox_Status.json?auth=Ov5Mgp1svU6rxpQmivehytuAPwnHcJj0ZS8U6YP3"; 

// --- REPLACE WITH YOUR ACTUAL LOCAL WI-FI DETAILS ---
const char* ssid = "GFiber_B7EC9";       // Put your Wi-Fi name here
const char* password = "80739362"; // Put your Wi-Fi password here

DHT dht(DHTPIN, DHTTYPE);
const float TEMP_THRESHOLD = 25.0;  

unsigned long lastTransmitTime = 0;
const unsigned long transmitInterval = 5000;  

// Forward declarations
void connectToWiFi();
int calculateTimeToSpoil(float temp, float hum);
void streamDataToFirebase(float temp, float hum, int spoilTime);

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); 

  dht.begin();
  connectToWiFi();
  Serial.println("Smart-AgriBox Light-Node Ready.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(2000);
    return;
  }

  // Local Automation Control Loop
  if (temperature > TEMP_THRESHOLD) {
    digitalWrite(RELAY_PIN, HIGH); // Turn Peltier ON
    Serial.println("[ALERT] Temperature high! Activating Peltier Cooling...");
  } else {
    digitalWrite(RELAY_PIN, LOW);  // Turn Peltier OFF
    Serial.println("[STATUS] Climate stable. Cooling deactivated.");
  }

  // Non-blocking transmission timer
  if (millis() - lastTransmitTime >= transmitInterval) {
    lastTransmitTime = millis();
    int minutesToSpoil = calculateTimeToSpoil(temperature, humidity);
    streamDataToFirebase(temperature, humidity, minutesToSpoil);
  }

  delay(2000); // 2 second sampling delay
}

void connectToWiFi() {
  Serial.print("Connecting to Wi-Fi Network: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[CONNECTED] IP Address assigned: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[ERROR] Wi-Fi Timeout.");
  }
}

int calculateTimeToSpoil(float temp, float hum) {
  if (temp > 35) return 90;           
  if (temp > 30) return 180;          
  if (temp > 25) return 360;          
  return 1440;                      
}

void streamDataToFirebase(float temp, float hum, int spoilTime) {
  Serial.println("\n>>> [CLOUD SYNC] Pushing Live Telemetry to Firebase Database...");
  HTTPClient http;
  http.begin(FIREBASE_URL);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"temperature\":" + String(temp, 1) + 
                       ",\"humidity\":" + String(hum, 1) + 
                       ",\"timeToSpoil\":" + String(spoilTime) + "}";

  int httpResponseCode = http.PATCH(jsonPayload);
  if (httpResponseCode > 0) {
    Serial.print("    [SUCCESS] Firebase Response Code: ");
    Serial.println(httpResponseCode);
    if (httpResponseCode == 200) {
      Serial.println("    [FIREBASE LOG] Tree synchronized cleanly.");
    }
  } else {
    Serial.print("    [ERROR] REST Transmission failed: ");
    Serial.println(HTTPClient::errorToString(httpResponseCode));
  }
  http.end();
}