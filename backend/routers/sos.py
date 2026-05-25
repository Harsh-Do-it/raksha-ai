import time
import random
import requests
from datetime import datetime


class RakshaAISOS:
    """
    Raksha AI - Emergency SOS Module

    Features:
    ----------
    1. Detect possible accidents
    2. Generate emergency alerts
    3. Notify emergency contacts
    4. Share live location
    5. Connect nearby hospitals & police
    6. Maintain emergency logs
    """

    def __init__(self, user_name, emergency_contacts):
        self.user_name = user_name
        self.emergency_contacts = emergency_contacts
        self.location = None

    # -----------------------------------------------------------
    # LOCATION FETCHING
    # -----------------------------------------------------------
    def get_live_location(self):
        """
        Fetch approximate live location using IP.
        Replace later with GPS/mobile API.
        """

        try:
            response = requests.get("https://ipinfo.io/json")
            data = response.json()

            self.location = {
                "city": data.get("city"),
                "region": data.get("region"),
                "country": data.get("country"),
                "coordinates": data.get("loc")
            }

            return self.location

        except Exception as e:
            print(f"[ERROR] Unable to fetch location: {e}")
            return None

    # -----------------------------------------------------------
    # ACCIDENT DETECTION SIMULATION
    # -----------------------------------------------------------
    def detect_accident(self):
        """
        Simulates accident detection.

        Future Improvements:
        --------------------
        - Accelerometer integration
        - Gyroscope sensor analysis
        - AI crash prediction
        - Camera-based collision detection
        """

        print("\n[INFO] Monitoring vehicle status...")
        time.sleep(2)

        accident_probability = random.randint(1, 10)

        if accident_probability > 7:
            print("[ALERT] Possible accident detected!")
            return True

        print("[SAFE] No accident detected.")
        return False

    # -----------------------------------------------------------
    # SOS ALERT CREATION
    # -----------------------------------------------------------
    def generate_sos_alert(self):
        """Generate emergency SOS alert message."""

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if not self.location:
            self.get_live_location()

        location = self.location or {}

        message = f"""
        ===============================
                RAKSHA AI SOS ALERT
        ===============================

        User: {self.user_name}
        Time: {timestamp}

        Possible road accident detected.

        Location Details:
        City: {location.get('city')}
        Region: {location.get('region')}
        Country: {location.get('country')}
        Coordinates: {location.get('coordinates')}

        Immediate assistance may be required.
        """

        return message

    # -----------------------------------------------------------
    # SEND EMERGENCY ALERTS
    # -----------------------------------------------------------
    def send_alerts(self, message):
        """
        Send SOS alerts.

        Replace print statements later with:
        - Twilio SMS API
        - Email API
        - WhatsApp API
        - Firebase Push Notifications
        """

        print("\n[INFO] Sending emergency alerts...")

        for contact in self.emergency_contacts:
            print(f"\nSending alert to: {contact}")
            print(message)
            time.sleep(1)

        print("\n[SUCCESS] Emergency alerts sent successfully.")

    # -----------------------------------------------------------
    # FIND NEARBY SERVICES
    # -----------------------------------------------------------
    def nearby_emergency_services(self):
        """
        Mock nearby emergency services.

        Future:
        -------
        Integrate Google Maps API / OpenStreetMap.
        """

        hospitals = [
            "City Trauma Center",
            "Apollo Emergency Unit",
            "AIIMS Emergency Wing"
        ]

        police_stations = [
            "Central Traffic Police Station",
            "Highway Safety Patrol Unit"
        ]

        print("\n========== Nearby Emergency Services ==========")

        print("\nHospitals:")
        for hospital in hospitals:
            print(f"- {hospital}")

        print("\nPolice Stations:")
        for station in police_stations:
            print(f"- {station}")

    # -----------------------------------------------------------
    # SAVE INCIDENT LOG
    # -----------------------------------------------------------
    def save_log(self, message):
        """Store incident details locally."""

        try:
            with open("sos_logs.txt", "a", encoding="utf-8") as file:
                file.write(message)
                file.write("\n\n")

            print("\n[INFO] Incident log saved.")

        except Exception as e:
            print(f"[ERROR] Could not save logs: {e}")

    # -----------------------------------------------------------
    # MAIN SOS WORKFLOW
    # -----------------------------------------------------------
    def activate_sos(self):
        """Complete SOS emergency workflow."""

        print("\n========== RAKSHA AI SOS SYSTEM ==========")

        self.get_live_location()

        accident = self.detect_accident()

        if accident:
            alert_message = self.generate_sos_alert()

            self.send_alerts(alert_message)
            self.nearby_emergency_services()
            self.save_log(alert_message)

            print("\n[CRITICAL] Emergency protocol activated.")

        else:
            print("\n[INFO] System operating normally.")


# ===============================================================
# DRIVER CODE
# ===============================================================
if __name__ == "__main__":

    emergency_contacts = [
        "+91-9876543210",
        "family_contact@example.com",
        "friend_contact@example.com"
    ]

    raksha_sos = RakshaAISOS(
        user_name="Raksha AI User",
        emergency_contacts=emergency_contacts
    )

    raksha_sos.activate_sos()