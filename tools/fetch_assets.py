"""一次性素材本地化脚本：字体 + 分类图 + 产品图。
运行后 assets/ 目录自包含，站点可离线打开。
"""
import gzip
import io
import os
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "assets", "fonts")
CAT_DIR = os.path.join(ROOT, "assets", "img", "cat")
PROD_DIR = os.path.join(ROOT, "assets", "img", "prod")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# 原站分类插画（按分类 slug -> 远程文件名）
CAT_IMAGES = {
    "earbuds-headphones": "cat-earbuds-D6YBH9HM.png",
    "speakers": "cat-speakers-MX8HVFbk.png",
    "perfumes": "cat-perfumes-C9R5FNQ6.png",
    "watches": "cat-watches-BBJFZJIH.png",
    "hair-dryers": "cat-hair-dryers-C57Yc_jX.png",
    "vacuum-cleaners": "cat-vacuum-cleaners-CqSTGiYo.png",
    "cameras": "cat-cameras-CeuGMJWc.png",
    "sunglasses": "cat-sunglasses-DNtCAX3G.png",
    "chargers": "cat-chargers-BAWM9Qq0.png",
    "phone-cases": "cat-phone-cases-B3wYKBBG.png",
    "other": "cat-other-DHmnEr_p.png",
}
ORIGIN = "https://sleek-browse.lovable.app/assets/"

# 产品图：slug -> Unsplash photo id
PRODUCT_IMAGES = {
    "airpods-pro-2": "photo-1606220588913-b3aacb4d2f46",
    "airpods-max": "photo-1618366712010-f4ae9c647dcb",
    "airpods-4": "photo-1590658268037-6bf12165a8df",
    "sony-wh1000": "photo-1583394838336-acd977736f90",
    "jbl-flip-7": "photo-1608043152269-423dbba4e7e1",
    "jbl-charge": "photo-1545454675-3531b543be5d",
    "boom-tower": "photo-1558379850-5ea4b0dd2ab8",
    "dior-sauvage": "photo-1541643600914-78b084683601",
    "bleu-chanel": "photo-1594035910387-fea47794261f",
    "baccarat": "photo-1523293182086-7651a899d37f",
    "oud-royale": "photo-1587017539504-67cfbddac569",
    "rolex-submariner": "photo-1587836374828-4dbafa94cf0e",
    "rolex-daytona": "photo-1524805444758-089113d48a6d",
    "ap-royal-oak": "photo-1509048191080-d2984bad6ae5",
    "apple-watch-10": "photo-1579586337278-3befd40fd17a",
    "galaxy-watch": "photo-1508685096489-7aacd43bd3b1",
    "dyson-supersonic": "photo-1522337360788-8b13dee7a37e",
    "dyson-airwrap": "photo-1560869713-da86bd4f31b0",
    "dyson-v15": "photo-1558317374-067fb5f30001",
    "robot-vac": "photo-1583947215259-38e31be8751f",
    "sony-a7": "photo-1502920917128-1aa500764cbd",
    "gopro-13": "photo-1502920514313-52581002a659",
    "cartier-glasses": "photo-1572635196237-14b3f281503f",
    "rayban-meta": "photo-1508296695146-257a814070b4",
    "gentle-monster": "photo-1577803645773-f96470509666",
    "gan-65w": "photo-1583863788434-e58a36330cf0",
    "magsafe-pad": "photo-1609592515750-b1ae0d1e7d0c",
    "iphone-case-clear": "photo-1601593346740-925612772716",
    "leather-case": "photo-1556656793-08538906a9f8",
}


def fetch(url, timeout=60):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept-Encoding": "gzip",
        "Accept": "*/*",
    })
    resp = urllib.request.urlopen(req, timeout=timeout)
    data = resp.read()
    if resp.headers.get("Content-Encoding") == "gzip":
        data = gzip.decompress(data)
    return data


def save(path, data):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return "skip"
    with open(path, "wb") as f:
        f.write(data)
    return f"{len(data)//1024}KB"


def dl_one(job):
    url, dest = job
    try:
        return (os.path.basename(dest), save(dest, fetch(url)))
    except Exception as e:
        return (os.path.basename(dest), f"FAIL {e}")


def download_images():
    jobs = []
    for slug, name in CAT_IMAGES.items():
        jobs.append((ORIGIN + name, os.path.join(CAT_DIR, f"{slug}.png")))
    for slug, pid in PRODUCT_IMAGES.items():
        url = f"https://images.unsplash.com/{pid}?auto=format&fit=crop&w=800&q=80"
        jobs.append((url, os.path.join(PROD_DIR, f"{slug}.jpg")))
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(dl_one, jobs))
    ok = sum(1 for _, r in results if not r.startswith("FAIL"))
    fails = [n for n, r in results if r.startswith("FAIL")]
    print(f"[images] {ok}/{len(jobs)} ok")
    if fails:
        print("[images] failed:", fails)
    return len(fails) == 0


FONT_CSS = ("https://fonts.googleapis.com/css2"
            "?family=Instrument+Serif:ital@0;1"
            "&family=Manrope:wght@300;400;500;600;700;800"
            "&display=swap")


def download_fonts():
    css = fetch(FONT_CSS).decode("utf-8")
    # 逐个 @font-face 解析：family / style / weight / url / unicode-range
    blocks = re.findall(r"@font-face\s*\{([^}]+)\}", css)
    faces = []
    for b in blocks:
        fam = re.search(r"font-family:\s*'([^']+)'", b)
        style = re.search(r"font-style:\s*(\w+)", b)
        weight = re.search(r"font-weight:\s*([\d ]+)", b)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", b)
        urange = re.search(r"unicode-range:\s*([^;]+);", b)
        if not (fam and url):
            continue
        r = urange.group(1) if urange else ""
        # 只保留 latin / latin-ext，避免下载几十个 CJK、西里尔子集
        keep = ("U+0000-00FF" in r) or ("U+0100-02BA" in r) or (not r)
        if not keep:
            continue
        faces.append({
            "family": fam.group(1),
            "style": style.group(1) if style else "normal",
            "weight": (weight.group(1).strip() if weight else "400"),
            "url": url.group(1),
            "range": r.strip(),
        })

    seen, jobs = set(), []
    for i, f in enumerate(faces):
        key = (f["family"], f["style"], f["weight"], f["range"])
        if key in seen:
            continue
        seen.add(key)
        slug = re.sub(r"[^a-z0-9]+", "-", f["family"].lower()).strip("-")
        name = f"{slug}-{f['weight'].replace(' ', '-')}-{f['style']}-{i}.woff2"
        f["local"] = "fonts/" + name
        jobs.append((f["url"], os.path.join(FONT_DIR, name)))

    with ThreadPoolExecutor(max_workers=6) as ex:
        list(ex.map(dl_one, jobs))

    lines = ["/* 本地化字体，由 tools/fetch_assets.py 生成；请勿手改 */"]
    for f in faces:
        lines.append("@font-face {")
        lines.append(f"  font-family: '{f['family']}';")
        lines.append(f"  font-style: {f['style']};")
        lines.append(f"  font-weight: {f['weight']};")
        lines.append("  font-display: swap;")
        lines.append(f"  src: url('../{f['local']}') format('woff2');")
        if f["range"]:
            lines.append(f"  unicode-range: {f['range']};")
        lines.append("}")
    out = os.path.join(ROOT, "assets", "css", "fonts.css")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"[fonts] {len(jobs)} files, css -> {os.path.basename(out)}")


if __name__ == "__main__":
    download_fonts()
    download_images()
