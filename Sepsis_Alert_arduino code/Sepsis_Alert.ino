

#include <BLEDevice.h>      // Main BLE library
#include <BLEServer.h>      // Used to create BLE server
#include <BLEUtils.h>       // BLE helper utilities
#include <BLE2902.h>        // Required for notifications

// Unique IDs used by BLE to identify the service and characteristic
#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define CHARACTERISTIC_UUID "abcd1234-5678-1234-5678-123456789abc"

// Pointer to the BLE characteristic
BLECharacteristic *pCharacteristic;

// Variable to check if a phone is connected
bool deviceConnected = false;


int Pulse_spO2();
void check_pulse();
void check_spO2();
void Body_temp();

#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"


MAX30105 particleSensor;
// TwoWire Wire1 = TwoWire(1);

int flag=0; int flag2=0;
const byte RATE_SIZE = 4; // Increase this for more averaging. 4 is good.
byte rates[RATE_SIZE]; // Array of heart rates
byte rateSpot = 0;
long lastBeat = 0; // Time at which the last beat occurred

float beatsPerMinute = 0.0;
int beatAvg = 0;
float SpO2 = 0.0;
long irValue;
long redValue;

const int SPO2_BUFFER_SIZE = 10; // Number of SpO2 readings to average
float spO2Buffer[SPO2_BUFFER_SIZE] = {0}; // Array to store SpO2 readings
int spO2Index = 0;                        // Current index in the array
float spO2Sum = 0;
float avgSpO2 = 0.0;

unsigned long currentTime;
unsigned long elapsedTime;
unsigned long startTime = 0;

// //body temp mills
unsigned long previousMillis = 0; // Store the last time the function was called
unsigned long currentMillis;

//Temp
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 4

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
float Celsius = 0;
float Fahrenheit = 0;

// Callback class triggered when phone connects/disconnects
class MyServerCallbacks: public BLEServerCallbacks {

  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Phone connected");
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Phone disconnected");

    // Add a small delay then restart advertising so phone can reconnect
    delay(500); 
    BLEDevice::startAdvertising();
    Serial.println("Advertising restarted... ready for new connection.");
  }
};


// Callback class triggered when phone writes data to ESP32
class MyCallbacks: public BLECharacteristicCallbacks {

  void onWrite(BLECharacteristic *pCharacteristic) {

    // Read data sent from the phone
    String receivedValue = pCharacteristic->getValue();

    if (receivedValue.length() > 0) {

      Serial.print("Phone sent: ");
      Serial.println(receivedValue);

      // If phone sends "hi"
      if (receivedValue == "HR") {

        particleSensor.setPulseAmplitudeRed(0x1F);
        particleSensor.setPulseAmplitudeIR(0x1F);

        // RESET VARIABLES
        flag = 1;
        flag2 = 0;
        startTime = 0;
        spO2Sum = 0;
        spO2Index = 0;

        beatAvg = 0;
        beatsPerMinute = 0;

        // Give it 15 seconds to find a finger
        unsigned long searchStart = millis();
        bool success = false;
        
        do {
          flag = Pulse_spO2();
          // Added: break out if it's been searching for more than 15 seconds
          if (millis() - searchStart > 15000) {
            Serial.println("Measurement timeout (no finger detected).");
            break;
          }
        } while(flag);


        String reply = "BPM: " + String(beatsPerMinute) + "BPM AVG: " + String(beatAvg) + "SP02 " + String(SpO2);

        // Print response in Serial Monitor
        Serial.print("ESP32 reply: ");
        Serial.println(reply);

        // Send response back to phone
        pCharacteristic->setValue(reply.c_str());
        pCharacteristic->notify();
      }

      if (receivedValue == "TEM") {
        Body_temp();

        String reply = "Tem" + String(Celsius);

        // Print response in Serial Monitor
        Serial.print("ESP32 reply: ");
        Serial.println(reply);

        // Send response back to phone
        pCharacteristic->setValue(reply.c_str());
        pCharacteristic->notify();
      }
    }
  }
};


void setup() {

  // Start serial communication for debugging
  Serial.begin(115200);

  Serial.println("Starting BLE...");

  // Initialize BLE device with a name visible to phones
  BLEDevice::init("ESP32_CHAT");

  // Create BLE server
  BLEServer *pServer = BLEDevice::createServer();

  // Attach connection callbacks
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |     // Phone can read data
                      BLECharacteristic::PROPERTY_WRITE |    // Phone can send data
                      BLECharacteristic::PROPERTY_NOTIFY     // ESP32 can send notifications
                    );

  // Descriptor required for notifications
  pCharacteristic->addDescriptor(new BLE2902());

  // Attach write callback
  pCharacteristic->setCallbacks(new MyCallbacks());

  // Start the service
  pService->start();

  // Start BLE advertising so phone can discover ESP32
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->start();

  Serial.println("BLE ready. Waiting for phone...");

   Wire1.begin(25, 26);
  Serial.println("Initializing MAX30102...");
  if (!particleSensor.begin(Wire1, I2C_SPEED_STANDARD)) {
    Serial.println("MAX30102 not found. Please check wiring/power.");
    return;
  }

  //   // Configure the sensor
  particleSensor.setup(); // Default settings
  particleSensor.setPulseAmplitudeRed(0x1F); // Set Red LED current
  particleSensor.setPulseAmplitudeIR(0x1F);  // Set IR LED current

  sensors.begin();
}


void loop() {

  // loop() can remain empty because BLE events
  // (connect, disconnect, write) are handled by callbacks



}

int Pulse_spO2()
{
  irValue = particleSensor.getIR();
  redValue = particleSensor.getRed();

  // Check if finger is placed on the sensor
  if (redValue > 5000 || irValue > 5000) 
  {
    if (flag2==0) 
    {
      // Adjust start time to account for the pause
      startTime = millis();
      Serial.print("MAX30102 Starting time: ");
      Serial.println(startTime);
      flag2 = 1;

      avgSpO2=0.0;
      SpO2=0.0;
      beatsPerMinute = 0.0;
      beatAvg = 0;
    
    }
  
      currentTime = millis(); // Get the current time
      elapsedTime = currentTime - startTime;

      
      if (elapsedTime < 500) {
        Serial.println("Sensor starting, please wait...");
      } 
      
      else if (elapsedTime > 500 && elapsedTime <= 16000) { // Run check_pulse() for 20 seconds
        check_pulse();
      } 
      
      else if (elapsedTime > 16000 && elapsedTime <= 22000) { // Run check_spO2() for 5 seconds
        check_spO2();
      } 


      else 
      {
        // Display final results and turn off the sensor
        Serial.println();
        Serial.println("----------------------------------");
        Serial.print("BPM=");
        Serial.print(beatsPerMinute);
        Serial.print(", Avg BPM=");
        Serial.print(beatAvg);
        Serial.print(", SpO2=");
        Serial.print(SpO2);
        Serial.print("%, Avg SpO2=");
        Serial.print(avgSpO2);
        Serial.println("%");
        Serial.println("----------------------------------");

        // Turn off the LEDs
        particleSensor.setPulseAmplitudeRed(0x00);
        particleSensor.setPulseAmplitudeIR(0x00);
        return 0;
      }
    return 1;
  }

  // Finger not detected
  else
   { 
    Serial.println("Finger not detected. Please place your finger on the sensor.");
    flag2=0;
    delay(500); // Add a small delay so it doesn't flood the serial monitor
    return 1; // Return 1 to try again
  } 

  return 1; //Error
}

void check_pulse() {
  if (checkForBeat(irValue)) {
    // We sensed a beat!
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute; // Store this reading in the array
      rateSpot %= RATE_SIZE; // Wrap variable

      // Take average of readings
      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) {
        beatAvg += rates[x];
      }
      beatAvg /= RATE_SIZE;
    }
  }

    // Send data to Serial Plotter (Heart Rate and Average BPM)
  Serial.print(beatsPerMinute); 
  Serial.print("\t"); // Use tab space to separate values
  Serial.println(beatAvg); // Print average BPM
}

void check_spO2() {

  static float redDC = 0;
  static float irDC = 0;

  // Low-pass filter to get DC component
  redDC = 0.95 * redDC + 0.05 * redValue;
  irDC  = 0.95 * irDC  + 0.05 * irValue;

  // AC component
  float redAC = redValue - redDC;
  float irAC  = irValue - irDC;

  // Ratio calculation
  float R = (redAC / redDC) / (irAC / irDC);

  // SpO2 estimation
  SpO2 = 110 - 25 * R;

  // Limit valid range
  if (SpO2 > 100) SpO2 = 100;
  if (SpO2 < 80)  SpO2 = 80;

  // Moving average buffer
  spO2Sum -= spO2Buffer[spO2Index];
  spO2Buffer[spO2Index] = SpO2;
  spO2Sum += SpO2;

  spO2Index = (spO2Index + 1) % SPO2_BUFFER_SIZE;

  avgSpO2 = spO2Sum / SPO2_BUFFER_SIZE;

  // Debug output
  Serial.print("Red=");
  Serial.print(redValue);
  Serial.print(", IR=");
  Serial.print(irValue);
  Serial.print(", SpO2=");
  Serial.print(SpO2);
  Serial.print("%, Avg SpO2=");
  Serial.print(avgSpO2);
  Serial.println("%");
}

void Body_temp()
{
  int i=0;
  while(i<=2)
  {
    currentMillis = millis();
    // if (currentMillis - previousMillis >=30000) 
    if (currentMillis - previousMillis >= 1000) 
    {
        i++;
        previousMillis = currentMillis; // Update last execution time

            
        sensors.requestTemperatures();

        Celsius = sensors.getTempCByIndex(0);
        Fahrenheit = sensors.toFahrenheit(Celsius);

        Serial.print(Celsius);
        Serial.print(" C  ");
        Serial.print(Fahrenheit);
        Serial.println(" F");
      
    }
  }
}