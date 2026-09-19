import os
import time
from playwright.sync_api import sync_playwright

os.makedirs("/home/jules/verification/videos", exist_ok=True)
os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5173")
        page.wait_for_timeout(2000)

        # Click on CITY 3D button in Header
        print("Switching to CITY 3D view mode...")
        city_button = page.get_by_role("button", name="CITY 3D")
        city_button.click()
        page.wait_for_timeout(3000)

        # Click on STREET WALK mode
        print("Testing Street Walk mode...")
        street_button = page.get_by_role("button", name="STREET WALK")
        street_button.click()
        page.wait_for_timeout(2000)

        # Click on FLYOVER CITY mode
        print("Testing Flyover mode...")
        flyover_button = page.get_by_role("button", name="FLYOVER CITY")
        flyover_button.click()
        page.wait_for_timeout(2000)

        # Search for a coin e.g. "BTC"
        print("Testing search for BTC...")
        search_input = page.get_by_placeholder("Search skyscraper coin...")
        search_input.fill("BTC")
        page.wait_for_timeout(1000)

        # Click on search result
        print("Selecting BTC from search dropdown...")
        page.get_by_text("Bitcoin").click()
        page.wait_for_timeout(2000)

        # Take screenshot of the City 3D Dashboard with BTC skyscraper modal open
        screenshot_path = "/home/jules/verification/screenshots/city_3d_dashboard.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        page.wait_for_timeout(1000)
        context.close()
        browser.close()

if __name__ == "__main__":
    run()
