# Smart-AgriBox: Micro-Climate IoT Preservation System

## 🌱 Overview
The **Smart-AgriBox** is an affordable, portable, and automated micro-climate storage unit engineered to tackle post-harvest losses for small-scale agricultural vendors operating in local public markets (*palengkes*). By integrating solid-state thermoelectric cooling with precise Internet-of-Things (IoT) environmental sensing, the system maintains optimal temperature and relative humidity thresholds to extend the sellable shelf life of fresh produce without chemical preservatives.

---

## 👥 Project Team
* **Team Leader:** Aaron Zabdiel J. Acera
* **Members:** 
  * Joedel Ceasar J. Acera
  * Reynel M. Marcellana

---

## ⚙️ System Architecture & Working Logic
The system operates on a continuous feedback loop managed by an ESP32 microcontroller:
1. **Sensing:** The DHT22 sensor continuously measures internal temperature and humidity.
2. **Processing:** The ESP32 microcontroller evaluates these metrics against pre-programmed baseline storage thresholds.
3. **Actuation:** If internal temperatures exceed target limits, a relay module triggers the Peltier cooling module and ventilation fans.
4. **Cloud Telemetry:** Sensor readings and cooling statuses are synchronized in real-time to the Firebase Realtime Database over Wi-Fi.
5. **Monitoring:** The Android mobile application and local OLED display pull state changes from Firebase to deliver real-time visibility, freshness countdowns, and alerts.

---

## 🛠️ Hardware & Software Components

| Component | Category | Function / Purpose |
| :--- | :--- | :--- |
| **ESP32** | Microcontroller | Main controller unit; processes logic and handles Wi-Fi telemetry synchronization. |
| **DHT22** | Sensor | High-accuracy digital temperature and humidity sensor. |
| **Peltier Module (TEC1-12706)** | Actuator | Thermo-electric cooling element used to drop internal box temperature. |
| **Relay Module** | Switch | Allows the low-voltage ESP32 to safely switch high-current Peltier and fan power. |
| **Fans & Heat Sinks** | Cooling & Thermal Management | Dissipates hot-side heat from the Peltier module to maximize performance. |
| **OLED (SSD1306)** | Local Display UI | Displays local temperature, humidity, and system status directly on the box. |
| **Firebase Realtime Database** | Cloud Layer | Stores and syncs telemetry data between the ESP32 and mobile app in real time. |
| **Android Application** | Mobile UI | Remote dashboard for live monitoring, threshold alerts, and manual controls. |

---

## 📱 User Interface & Features
* **Main Dashboard:** Displays live temperature and humidity metrics against target goals, real-time cooling status, freshness percentage, and quick toggles for manual cooling, fans, and misting.
* **Commodity Profiles:** Allows vendors to select preset micro-climate thresholds tailored for specific produce (e.g., Pechay, Carrots, Cabbage) to update system parameters automatically.
* **Unit Management & Alert History:** Tracks active hardware status, firmware calibration settings, historical temperature logs (such as critical temperature alerts), and offline telemetry synchronization states.
