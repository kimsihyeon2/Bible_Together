import os
import re
import base64
from pathlib import Path

# Paths
INPUT_HTML_PATH = r"d:\bible-together\1.html"
OUTPUT_HTML_PATH = r"d:\bible-together\1_portable.html"

# Function to encode image to base64
def encode_image(image_path):
    try:
        # Handle relative paths (like ./public/...) based on HTML file location
        if not os.path.isabs(image_path):
            # Assume relative to d:\bible-together since that's where 1.html is
            base_dir = os.path.dirname(INPUT_HTML_PATH)
            image_path = os.path.join(base_dir, image_path)

        # Normalize path
        image_path = os.path.normpath(image_path)
            
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Determine mime type
            ext = os.path.splitext(image_path)[1].lower()
            mime_type = "image/png" # default
            if ext == '.jpg' or ext == '.jpeg':
                mime_type = "image/jpeg"
            elif ext == '.webp':
                mime_type = "image/webp"
            elif ext == '.svg':
                mime_type = "image/svg+xml"
                
            return f"data:{mime_type};base64,{encoded_string}"
    except Exception as e:
        print(f"Error encoding {image_path}: {e}")
        return None

# Read HTML
with open(INPUT_HTML_PATH, "r", encoding="utf-8") as f:
    html_content = f.read()

# Find all img tags with src
# Regex to capture src="..." or src='...'
img_src_pattern = re.compile(r'(<img[^>]+src=["\'])([^"\']+)(["\'])', re.IGNORECASE)

def replace_match(match):
    prefix = match.group(1)
    src_path = match.group(2)
    suffix = match.group(3)
    
    # Skip if already base64 or remote URL (http/https)
    if src_path.startswith("data:") or src_path.startswith("http"):
        return match.group(0)
    
    print(f"Processing image: {src_path}")
    base64_data = encode_image(src_path)
    
    if base64_data:
        print(f"  -> Encoded successfully")
        return f"{prefix}{base64_data}{suffix}"
    else:
        print(f"  -> Failed to encode, keeping original")
        return match.group(0)

# Replace images
new_html_content = img_src_pattern.sub(replace_match, html_content)

# Write output
with open(OUTPUT_HTML_PATH, "w", encoding="utf-8") as f:
    f.write(new_html_content)

print(f"Portable HTML created at: {OUTPUT_HTML_PATH}")
