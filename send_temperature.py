import serial
import time
import requests

# ==============================
# إعدادات RS485
# ==============================
PORT = "COM3"
BAUDRATE = 9600

# ==============================
# إعدادات Vercel API
# ==============================
API_URL = "https://YOUR-PROJECT.vercel.app/api/sensor"
API_KEY = "PUT_YOUR_SENSOR_API_KEY_HERE"

LOCATION = "tikrit"
WAREHOUSE_ID = 1
SENSOR_ID = 1

ser = None

try:
    ser = serial.Serial(
        port=PORT,
        baudrate=BAUDRATE,
        bytesize=8,
        parity=serial.PARITY_NONE,
        stopbits=serial.STOPBITS_ONE,
        timeout=2
    )

    time.sleep(1)
    ser.reset_input_buffer()

    print("==============================")
    print("RS485 Connected")
    print("Port:", PORT)
    print("Baudrate:", BAUDRATE)
    print("API:", API_URL)
    print("==============================")

    while True:
        try:
            data = ser.readline()

            if not data:
                continue

            text = data.decode("utf-8", errors="ignore").strip()
            if not text:
                continue

            try:
                temperature = float(text)
            except ValueError:
                print("Received:", text)
                continue

            print("Temperature:", f"{temperature:.2f}", "°C")

            payload = {
                "location": LOCATION,
                "warehouse": WAREHOUSE_ID,
                "sensor": SENSOR_ID,
                "temperature": temperature
            }

            try:
                response = requests.post(
                    API_URL,
                    json=payload,
                    headers={"X-API-Key": API_KEY},
                    timeout=8
                )

                if response.ok:
                    print("API: OK")
                else:
                    print("API Error:", response.status_code, response.text)

            except requests.RequestException as e:
                print("Internet/API Error:", e)

        except KeyboardInterrupt:
            print("\nProgram stopped.")
            break
        except Exception as e:
            print("Reading Error:", e)

except serial.SerialException as e:
    print("Cannot open RS485 port")
    print("Error:", e)

finally:
    if ser and ser.is_open:
        ser.close()
        print("RS485 port closed.")
