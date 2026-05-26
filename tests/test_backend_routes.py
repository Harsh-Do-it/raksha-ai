import io
import unittest

from PIL import Image

from backend.main import app


class BackendRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()

    @staticmethod
    def make_png_bytes() -> bytes:
        buffer = io.BytesIO()
        Image.new("RGB", (64, 64), color=(255, 0, 0)).save(buffer, format="PNG")
        buffer.seek(0)
        return buffer.getvalue()

    def test_health_check(self):
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body["status"], "ok")
        self.assertIn("firebase", body)

    def test_risk_score_endpoint(self):
        response = self.client.post(
            "/risk/score",
            json={
                "lat": 28.6139,
                "lng": 77.209,
                "time": "night",
                "weather": "clear",
                "road": "damaged",
                "traffic": "moderate",
                "zone": "Connaught Place",
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertGreaterEqual(body["score"], 0)
        self.assertIn(body["label"], {"low", "medium", "high", "critical"})
        self.assertIn("factors", body)

    def test_dashboard_summary_endpoint(self):
        response = self.client.get("/dashboard/summary")

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertIn("stats", body)
        self.assertIn("hotspots", body)
        self.assertGreaterEqual(len(body["stats"]), 4)

    def test_sos_activation_endpoint(self):
        response = self.client.post(
            "/sos/activate",
            json={
                "location": {"lat": 28.6139, "lng": 77.209, "source": "test"},
                "emergency_contacts": ["+91-9999999999"],
                "user_id": "user-123",
                "note": "Automated test incident",
                "device_info": {"platform": "web"},
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertIn(body["status"], {"safe", "dispatched"})
        self.assertIn("location", body)

    def test_road_detection_endpoint(self):
        response = self.client.post(
            "/roads/detect",
            data={"file": (io.BytesIO(self.make_png_bytes()), "road-sample.png")},
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertIn(body["status"], {"complete", "processing"})
        self.assertTrue(body["jobId"])
        if body["status"] == "complete":
            self.assertTrue(body["label"])
            self.assertGreaterEqual(body["confidence"], 0)


if __name__ == "__main__":
    unittest.main()
