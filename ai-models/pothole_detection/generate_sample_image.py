from __future__ import annotations

from pathlib import Path

from PIL import Image


def main() -> None:
    output = Path("sample_image.png")
    image = Image.new("RGB", (64, 64), color=(120, 122, 124))
    for x in range(20, 45):
        for y in range(20, 45):
            image.putpixel((x, y), (40, 42, 45))
    image.save(output)
    print(f"Saved sample image to {output}")


if __name__ == "__main__":
    main()
