import os
from playwright.sync_api import sync_playwright

def run_verification():
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-gl=angle",
                "--use-angle=swiftshader",
                "--disable-gpu-sandbox",
                "--no-sandbox"
            ]
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()

        try:
            print("Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173", timeout=30000)
            page.wait_for_timeout(2000)

            # Click the MEV THREAT 3D tab button
            threat_button = page.locator("button:has-text('THREAT 3D')")
            if threat_button.count() > 0:
                print("Clicking MEV THREAT 3D button...")
                threat_button.first.click()
                page.wait_for_timeout(3000)

                page.screenshot(path="/home/jules/verification/screenshots/mev_threat_3d.png")
                print("MEV Threat 3D screenshot saved.")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run_verification()
