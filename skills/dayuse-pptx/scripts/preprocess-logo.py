#!/usr/bin/env python3
"""
Preprocess Dayuse logo: remove black background to create transparent PNG.
The logo source file has a black background (RGB mode) that needs to be
converted to transparency for use on slides.

Usage:
    python scripts/preprocess-logo.py <input.png> <output.png>
"""
import sys
from PIL import Image
import numpy as np

def remove_black_background(input_path, output_path, threshold=30, edge_threshold=60):
    """Remove black background from logo and save with alpha transparency."""
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)
    
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    
    # Make pure black pixels fully transparent
    black_mask = (r < threshold) & (g < threshold) & (b < threshold)
    data[black_mask, 3] = 0
    
    # Handle anti-aliased edges - gradual transparency for dark pixels
    dark_mask = (r < edge_threshold) & (g < edge_threshold) & (b < edge_threshold) & ~black_mask
    brightness = (r[dark_mask].astype(int) + g[dark_mask].astype(int) + b[dark_mask].astype(int)) / 3
    data[dark_mask, 3] = (brightness * 255 / edge_threshold).astype(np.uint8)
    
    result = Image.fromarray(data)
    result.save(output_path)
    print(f"Saved transparent logo to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python preprocess-logo.py <input.png> <output.png>")
        sys.exit(1)
    remove_black_background(sys.argv[1], sys.argv[2])
