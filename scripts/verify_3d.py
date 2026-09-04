import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("Starting Playwright verification...")
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

            # Take initial 2D screenshot
            print("Taking 2D screenshot...")
            page.screenshot(path="/home/jules/verification/screenshots/dashboard_2d.png")

            # Click the 3D button
            print("Locating 3D button...")
            three_d_button = page.locator("button:has-text('3D')")
            if three_d_button.count() > 0:
                print("Clicking 3D button...")
                three_d_button.first.click()
                page.wait_for_timeout(3000)

                # Take 3D screenshot
                print("Taking 3D screenshot...")
                page.screenshot(path="/home/jules/verification/screenshots/dashboard_3d_initial.png")

                # Perform interactive drag to rotate camera
                print("Interacting with 3D canvas...")
                canvas = page.locator("canvas")
                if canvas.count() > 0:
                    box = canvas.first.bounding_box()
                    if box:
                        start_x = box["x"] + box["width"] / 2
                        start_y = box["y"] + box["height"] / 2

                        # Drag mouse to rotate the scene
                        page.mouse.move(start_x, start_y)
                        page.mouse.down()
                        page.mouse.move(start_x + 200, start_y - 100, steps=20)
                        page.mouse.up()
                        page.wait_for_timeout(2000)

                        print("Taking rotated 3D screenshot...")
                        page.screenshot(path="/home/jules/verification/screenshots/dashboard_3d_rotated.png")
            else:
                print("Warning: 3D button not found in Header!")

        except Exception as e:
            print(f"Error occurred during verification: {e}")
        finally:
            context.close()
            browser.close()
            print("Playwright verification finished.")

if __name__ == "__main__":
    run_verification()
