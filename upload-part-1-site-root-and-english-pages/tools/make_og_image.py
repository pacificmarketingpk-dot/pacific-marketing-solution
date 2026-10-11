#!/usr/bin/env python3
"""Make a 1200x630 social-sharing (Open Graph) image in the Pacific Marketing Solution style.

Usage (needs Python 3 and Pillow:  pip install pillow):
  python make_og_image.py --title "AI Chatbots & Voice Agents" --sub "Answers and bookings around the clock" \
      --kicker "SERVICE" --out images/og/ai-chatbots-voice-agents.jpg
Optional key-figure card (used for articles):  --figure "3% to 5.2%" --figure-label "click-through rate across 3 SEO projects"
"""
import argparse, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1200, 630
INK, MUTED, ACCENT, NAVY = (238, 242, 255), (160, 172, 205), (169, 155, 255), (10, 16, 36)

def font(weight, size):
    for p in (os.path.join(HERE, 'fonts', 'PlusJakartaSans-%d.ttf' % weight), '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=fnt) <= max_w or not cur:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def make(title, sub, kicker, out, figure=None, figure_label=None, logo=None):
    img = Image.new('RGB', (W, H), NAVY)
    glow = Image.new('RGB', (W, H), (0, 0, 0)); g = ImageDraw.Draw(glow)
    g.ellipse((-220, -280, 640, 420), fill=(104, 86, 232)); g.ellipse((680, 240, 1440, 840), fill=(24, 156, 186))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(140)), 0.5)
    d = ImageDraw.Draw(img)
    # brand row
    logo = logo or os.path.join(HERE, 'logo-512.png')
    if os.path.exists(logo):
        mk = Image.open(logo).convert('RGBA').resize((76, 76), Image.LANCZOS)
        m = Image.new('L', (304, 304), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, 303, 303), radius=68, fill=255)
        mk.putalpha(m.resize((76, 76), Image.LANCZOS)); img.paste(mk, (72, 56), mk)
    d.text((166, 74), 'Pacific Marketing Solution', font=font(700, 29), fill=INK)
    # kicker pill
    kf = font(700, 20); ktxt = kicker.upper()
    kw = d.textlength(ktxt, font=kf) + 44
    d.rounded_rectangle((72, 178, 72 + kw, 220), radius=21, fill=(58, 48, 128)); d.text((94, 187), ktxt, font=kf, fill=(214, 209, 255))
    # headline (fits in at most 3 lines)
    max_w = 640 if figure else 960
    size = 84
    while True:
        tf = font(800, size); lines = wrap(d, title, tf, max_w)
        if (len(lines) <= 3 and all(d.textlength(l, font=tf) <= max_w for l in lines)) or size <= 48: break
        size -= 4
    y = 250
    for l in lines:
        d.text((72, y), l, font=tf, fill=INK); y += int(size * 1.12)
    sf = font(500, 34)
    for l in wrap(d, sub, sf, max_w)[:2]:
        d.text((72, y + 14), l, font=sf, fill=ACCENT); y += 44
    # key figure card
    if figure:
        card = Image.new('RGBA', (330, 250), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
        cd.rounded_rectangle((0, 0, 329, 249), radius=30, fill=(86, 72, 200, 235), outline=(255, 255, 255, 60), width=2)
        ff = font(800, 60)
        while cd.textlength(figure, font=ff) > 290 and ff.size > 28: ff = font(800, ff.size - 4)
        cd.text((26, 38), figure, font=ff, fill=(255, 255, 255))
        lf = font(500, 23); yy = 38 + int(ff.size * 1.35)
        for l in wrap(cd, figure_label or '', lf, 280)[:3]:
            cd.text((26, yy), l, font=lf, fill=(232, 232, 255)); yy += 32
        img.paste(card, (826, 190), card)
    # footer
    d.text((72, 566), 'pacificmarketingsolution.com', font=font(500, 25), fill=MUTED)
    pf = font(700, 23); pt = 'Houston, Texas and Lahore, Pakistan'; pw = d.textlength(pt, font=pf) + 48
    d.rounded_rectangle((W - 72 - pw, 552, W - 72, 598), radius=23, fill=ACCENT); d.text((W - 72 - pw + 24, 562), pt, font=pf, fill=NAVY)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    img.save(out, 'JPEG', quality=84, optimize=True, progressive=True)
    return out

if __name__ == '__main__':
    a = argparse.ArgumentParser()
    a.add_argument('--title', required=True); a.add_argument('--sub', default=''); a.add_argument('--kicker', default='')
    a.add_argument('--out', required=True); a.add_argument('--figure'); a.add_argument('--figure-label')
    x = a.parse_args(); print(make(x.title, x.sub, x.kicker, x.out, x.figure, x.figure_label))
