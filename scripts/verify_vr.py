import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("Starting Playwright VR verification...")
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

        # Catch console errors
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err.message}"))
        page.on("console", lambda msg: print(f"CONSOLE [{msg.type}]: {msg.text}"))

        try:
            print("Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173", timeout=30000)
            page.wait_for_timeout(3000)

            # Click the VR button in the view modes switcher
            print("Locating VR SPACE button...")
            vr_button = page.locator("button:has-text('VR SPACE')")
            if vr_button.count() > 0:
                print("Clicking VR SPACE button...")
                vr_button.first.click()
                page.wait_for_timeout(3000)

                # Take VR view screenshot
                print("Taking VR view screenshot...")
                page.screenshot(path="/home/jules/verification/screenshots/dashboard_vr_initial.png")

                # Perform interactive drag to rotate camera in VR fallback
                print("Interacting with VR fallback canvas...")
                canvas = page.locator("canvas")
                if canvas.count() > 0:
                    box = canvas.first.bounding_box()
                    if box:
                        start_x = box["x"] + box["width"] / 2
                        start_y = box["y"] + box["height"] / 2

                        page.mouse.move(start_x, start_y)
                        page.mouse.down()
                        page.mouse.move(start_x + 150, start_y - 50, steps=20)
                        page.mouse.up()
                        page.wait_for_timeout(2000)

                        print("Taking rotated VR screenshot...")
                        page.screenshot(path="/home/jules/verification/screenshots/dashboard_vr_rotated.png")
            else:
                print("Warning: VR SPACE button not found in Header!")

        except Exception as e:
            print(f"Error occurred during verification: {e}")
        finally:
            context.close()
            browser.close()
            print("Playwright VR verification finished.")

if __name__ == "__main__":
    run_verification()
