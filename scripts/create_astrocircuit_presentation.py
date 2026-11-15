from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "AstroHealth_Astrocircuit_Presentation.pptx"
ANATOMY_IMAGE = ROOT / "src" / "assets" / "astrohealth-five-systems-preview.png"
EMU = 914400
WIDTH = 13.333333
HEIGHT = 7.5

NAVY = "071426"
PANEL = "0D2038"
PANEL_LIGHT = "122B49"
CYAN = "59D8E8"
BLUE = "78AFFF"
WHITE = "F4F8FF"
MUTED = "A8B9CF"
AMBER = "FFC66D"
ROSE = "FF8294"
GREEN = "72E0B4"

slides = []


def emu(value):
    return round(value * EMU)


def shape(slide, x, y, w, h, fill, line=None, geometry="rect", line_width=1):
    shape_id = len(slide["shapes"]) + 2
    stroke = (
        f'<a:ln w="{round(line_width * 12700)}"><a:solidFill><a:srgbClr val="{line}"/>'
        f'</a:solidFill><a:prstDash val="solid"/></a:ln>'
        if line
        else '<a:ln><a:noFill/></a:ln>'
    )
    fill_xml = (
        f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>'
        if fill
        else '<a:noFill/>'
    )
    slide["shapes"].append(
        f'<p:sp><p:nvSpPr><p:cNvPr id="{shape_id}" name="Shape {shape_id}"/>'
        f'<p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/>'
        f'<a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm><a:prstGeom prst="{geometry}"><a:avLst/>'
        f'</a:prstGeom>{fill_xml}{stroke}</p:spPr></p:sp>'
    )


def text(slide, x, y, w, h, content, size=18, color=WHITE, bold=False,
         align="l", valign="ctr", font="Aptos", italic=False):
    shape_id = len(slide["shapes"]) + 2
    paragraphs = []
    for line in content.split("\n"):
        paragraphs.append(
            f'<a:p><a:pPr algn="{align}"/>'
            f'<a:r><a:rPr lang="en-US" sz="{round(size * 100)}" b="{1 if bold else 0}" '
            f'i="{1 if italic else 0}" dirty="0"><a:solidFill><a:srgbClr val="{color}"/>'
            f'</a:solidFill><a:latin typeface="{font}"/></a:rPr><a:t>{escape(line)}</a:t></a:r>'
            f'<a:endParaRPr lang="en-US" sz="{round(size * 100)}"/></a:p>'
        )
    slide["shapes"].append(
        f'<p:sp><p:nvSpPr><p:cNvPr id="{shape_id}" name="Text {shape_id}"/>'
        f'<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/>'
        f'<a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/>'
        f'</a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
        f'<p:txBody><a:bodyPr wrap="square" lIns="0" rIns="0" tIns="0" bIns="0" '
        f'anchor="{valign}"><a:noAutofit/></a:bodyPr><a:lstStyle/>{"".join(paragraphs)}</p:txBody></p:sp>'
    )


def card(slide, x, y, w, h, title, body, accent=CYAN, tag=None):
    shape(slide, x, y, w, h, PANEL, line="1B3B5D", geometry="roundRect")
    shape(slide, x + 0.2, y + 0.23, 0.055, h - 0.46, accent, geometry="roundRect")
    if tag:
        text(slide, x + 0.38, y + 0.24, w - 0.62, 0.28, tag.upper(), 9, accent, True)
        title_y = y + 0.63
    else:
        title_y = y + 0.35
    text(slide, x + 0.38, title_y, w - 0.64, 0.45, title, 17, WHITE, True)
    text(slide, x + 0.38, title_y + 0.56, w - 0.66, h - (title_y - y) - 0.76,
         body, 12, MUTED, valign="t")


def start_slide():
    slide = {"shapes": [], "image": False}
    shape(slide, 0, 0, WIDTH, HEIGHT, NAVY)
    shape(slide, 10.2, -1.5, 4.7, 4.7, "0A1C32", geometry="ellipse")
    shape(slide, -1.6, 5.4, 4.5, 4.5, "0A1C32", geometry="ellipse")
    slides.append(slide)
    return slide


def chrome(slide, page, section):
    shape(slide, 0.55, 0.46, 0.11, 0.11, CYAN, geometry="ellipse")
    text(slide, 0.76, 0.38, 2.8, 0.22, "ASTROHEALTH  /  ASTROCIRCUIT", 9, MUTED, True)
    text(slide, 9.0, 0.38, 3.75, 0.22, section.upper(), 9, CYAN, True, align="r")
    shape(slide, 0.55, 0.77, 12.23, 0.012, "19324D")
    shape(slide, 0.55, 7.05, 12.23, 0.012, "19324D")
    text(slide, 0.56, 7.12, 4.2, 0.18, "CREW HEALTH  •  SPACEFLIGHT", 8, "738AA6", True)
    text(slide, 11.6, 7.1, 1.17, 0.2, f"{page:02d} / 07", 9, MUTED, True, align="r")


def title(slide, kicker, headline, subline=None):
    text(slide, 0.65, 1.03, 11.9, 0.25, kicker.upper(), 10, CYAN, True)
    text(slide, 0.65, 1.36, 12.0, 0.66, headline, 27, WHITE, True)
    if subline:
        text(slide, 0.67, 2.05, 11.9, 0.38, subline, 12, MUTED)


def bullet(slide, x, y, label, detail, accent=CYAN, width=6.4):
    shape(slide, x, y + 0.05, 0.12, 0.12, accent, geometry="ellipse")
    text(slide, x + 0.28, y, width, 0.25, label, 14, WHITE, True)
    text(slide, x + 0.28, y + 0.31, width, 0.42, detail, 11, MUTED, valign="t")


def picture(slide, x, y, w, h):
    shape_id = len(slide["shapes"]) + 2
    slide["shapes"].append(
        f'<p:pic><p:nvPicPr><p:cNvPr id="{shape_id}" name="Anatomy artwork"/>'
        f'<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
        f'<p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
        f'<p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/>'
        f'</a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'
    )
    slide["image"] = True


def make_deck():
    slide = start_slide()
    shape(slide, 0.68, 0.78, 0.54, 0.54, PANEL_LIGHT, line="225076", geometry="ellipse")
    shape(slide, 0.84, 0.94, 0.22, 0.22, CYAN, geometry="ellipse")
    text(slide, 1.42, 0.88, 3.8, 0.25, "2026 NASA SPACE APPS CHALLENGE", 10, CYAN, True)
    text(slide, 0.72, 1.8, 6.5, 1.55, "AstroHealth:\ncrew health, clearer decisions.", 34, WHITE, True, valign="t")
    text(slide, 0.75, 3.65, 5.8, 0.74,
         "A browser-based health-monitoring concept for astronaut missions.", 17, MUTED, valign="t")
    shape(slide, 0.75, 4.75, 5.65, 0.012, "274662")
    text(slide, 0.75, 5.0, 2.4, 0.24, "PRESENTED BY", 9, MUTED, True)
    text(slide, 0.75, 5.34, 3.6, 0.48, "ASTROCIRCUIT", 21, WHITE, True)
    text(slide, 0.75, 6.5, 5.5, 0.25,
         "Health Monitoring Software for Astronauts on Space Missions", 9, "7890AC")
    shape(slide, 7.0, 1.25, 5.45, 4.95, PANEL, line="1B3B5D", geometry="roundRect")
    text(slide, 7.48, 1.66, 4.3, 0.3, "MISSION HEALTH WORKSPACE", 10, MUTED, True)
    shape(slide, 8.52, 2.3, 2.2, 2.2, "102B49", line="276184", geometry="ellipse", line_width=2)
    shape(slide, 9.07, 2.85, 1.1, 1.1, "123A56", line=CYAN, geometry="ellipse", line_width=2)
    text(slide, 9.18, 3.19, 0.88, 0.25, "+", 25, CYAN, True, align="ctr")
    for x, y, label, sub, color in [
        (7.5, 2.65, "SELF-CHECK", "symptoms + context", BLUE),
        (10.8, 2.65, "HEALTH MAP", "linked anatomy", CYAN),
        (7.5, 4.5, "SENSOR FILES", "ECG + sleep", GREEN),
        (10.8, 4.5, "WELLBEING", "crew check-ins", AMBER),
    ]:
        shape(slide, x, y, 1.5, 0.74, "102740", line="264663", geometry="roundRect")
        shape(slide, x + 0.14, y + 0.17, 0.1, 0.1, color, geometry="ellipse")
        text(slide, x + 0.31, y + 0.13, 1.08, 0.18, label, 8, WHITE, True)
        text(slide, x + 0.14, y + 0.4, 1.23, 0.18, sub, 8, MUTED)
    text(slide, 7.55, 5.6, 4.2, 0.3, "Capture  →  review  →  act safely", 12, CYAN, True)
    chrome(slide, 1, "Project overview")

    slide = start_slide()
    chrome(slide, 2, "The problem")
    title(slide, "The challenge", "Spaceflight changes the health-monitoring context.",
          "The challenge asks for software that helps astronauts assess their health during missions.")
    card(slide, 0.65, 2.75, 3.85, 2.68, "A different environment",
         "Microgravity, radiation, and closed habitats add mission-specific health factors.", CYAN, "01 / environment")
    card(slide, 4.75, 2.75, 3.85, 2.68, "Care is remote",
         "Crew need clear, usable information while operating far from Earth-based support.", BLUE, "02 / response")
    card(slide, 8.85, 2.75, 3.85, 2.68, "Signals are fragmented",
         "Symptoms, measurements, sensor files, and wellbeing context can be hard to review together.", AMBER, "03 / information")
    shape(slide, 0.66, 5.88, 12.03, 0.62, PANEL_LIGHT, line="1D4766", geometry="roundRect")
    text(slide, 0.95, 6.05, 11.5, 0.25,
         "DESIGN NEED   A crew-facing way to collect context and review it cautiously.", 13, WHITE, True)

    slide = start_slide()
    chrome(slide, 3, "Our response")
    title(slide, "The product", "One workspace for crew health context.",
          "AstroHealth connects self-checks, anatomy, sensor-file analysis, and wellbeing tools.")
    bullet(slide, 0.78, 2.75, "Self-Check", "Enter symptoms and mission/health context for an experimental ranking.", BLUE)
    bullet(slide, 0.78, 3.65, "Health Map", "Explore front/back system layers and explicitly linked content.", CYAN)
    bullet(slide, 0.78, 4.55, "Sensor workbench", "Load supported ECG or sleep CSV samples in the browser.", GREEN)
    bullet(slide, 0.78, 5.45, "Wellbeing + mission tools", "Record a sleep check-in; review environment, reminders, and emergency guidance.", AMBER)
    shape(slide, 8.2, 2.55, 4.4, 3.9, PANEL, line="1B3B5D", geometry="roundRect")
    picture(slide, 8.52, 2.72, 3.75, 3.3)
    text(slide, 8.55, 6.12, 3.7, 0.2, "BODY-SYSTEM ARTWORK  /  CONTEXT ONLY", 8, MUTED, True, align="ctr")

    slide = start_slide()
    chrome(slide, 4, "Features")
    title(slide, "What it does", "Four practical capabilities. One cautious workflow.")
    card(slide, 0.65, 2.3, 5.9, 1.55, "01  Self-Check",
         "Symptoms + mission context → ranked possibilities. Not a diagnosis.", BLUE)
    card(slide, 6.78, 2.3, 5.9, 1.55, "02  Health Map",
         "Browse body systems; show only explicitly linked model/catalogue associations.", CYAN)
    card(slide, 0.65, 4.12, 5.9, 1.55, "03  Sensor workbench",
         "ECG: 180-sample MLII beat window. Sleep: 30-second, 3,000 × 7 CSV epoch.", GREEN)
    card(slide, 6.78, 4.12, 5.9, 1.55, "04  Wellbeing + ops",
         "Self-reported sleep/recovery, mission environment, reminders, and emergency guide.", AMBER)
    text(slide, 0.75, 6.15, 11.7, 0.34,
         "Inputs and results stay in the browser in this prototype; sensor analysis uses files, not a live wearable link.",
         11, MUTED)

    slide = start_slide()
    chrome(slide, 5, "Workflow")
    title(slide, "How a crew member uses it", "From a signal to a safer next step.",
          "A short, transparent loop keeps the person—not the model—in control.")
    steps = [
        ("01", "CAPTURE", "Enter symptoms and context, or load a supported sample file.", BLUE),
        ("02", "REVIEW", "Run the experimental CDSS, ECG, or sleep workflow.", CYAN),
        ("03", "CONTEXTUALIZE", "Check saved entries and any explicitly linked anatomy.", GREEN),
        ("04", "FOLLOW PROTOCOL", "Use mission-approved procedures and medical support.", AMBER),
    ]
    for index, (number, label, body, accent) in enumerate(steps):
        x = 0.68 + index * 3.13
        shape(slide, x, 2.75, 2.75, 2.45, PANEL, line="1B3B5D", geometry="roundRect")
        shape(slide, x + 0.25, 3.0, 0.48, 0.48, PANEL_LIGHT, line=accent, geometry="ellipse", line_width=2)
        text(slide, x + 0.25, 3.14, 0.48, 0.15, number, 9, accent, True, align="ctr")
        text(slide, x + 0.26, 3.75, 2.25, 0.27, label, 11, accent, True)
        text(slide, x + 0.26, 4.18, 2.25, 0.73, body, 11, WHITE, valign="t")
        if index < len(steps) - 1:
            shape(slide, x + 2.82, 3.98, 0.24, 0.035, "42627F")
    shape(slide, 0.7, 5.72, 11.95, 0.68, "10263F", line="1D4766", geometry="roundRect")
    text(slide, 0.98, 5.92, 11.35, 0.25,
         "Model scores are experimental signals to review—not diagnoses, triage decisions, or treatment instructions.",
         11, AMBER, True)

    slide = start_slide()
    chrome(slide, 6, "Readiness")
    title(slide, "Prototype status", "Clear about what is ready—and what is not.")
    shape(slide, 0.67, 2.28, 5.87, 3.72, PANEL, line="1B3B5D", geometry="roundRect")
    text(slide, 1.0, 2.62, 5.0, 0.34, "IN THE CURRENT BUILD", 11, GREEN, True)
    bullet(slide, 1.02, 3.22, "Local-first", "Health entries and settings are stored in the browser.", GREEN, 4.9)
    bullet(slide, 1.02, 4.18, "File-based models", "Supported ECG and sleep CSV workflows are available.", GREEN, 4.9)
    bullet(slide, 1.02, 5.14, "Explicit links", "Map highlights require a catalogue/model association.", GREEN, 4.9)
    shape(slide, 6.8, 2.28, 5.87, 3.72, PANEL, line="1B3B5D", geometry="roundRect")
    text(slide, 7.13, 2.62, 5.0, 0.34, "NOT CLAIMED / NEXT TO VALIDATE", 11, AMBER, True)
    bullet(slide, 7.15, 3.22, "Clinical validity", "No diagnosis, validated thresholds, or proven clinical accuracy.", AMBER, 4.9)
    bullet(slide, 7.15, 4.18, "Live device connection", "Bluetooth is not implemented; device protocol is still needed.", AMBER, 4.9)
    bullet(slide, 7.15, 5.14, "Next steps", "Review datasets, anatomy links, and crew workflow with experts.", AMBER, 4.9)

    slide = start_slide()
    chrome(slide, 7, "Astrocircuit")
    text(slide, 0.72, 1.3, 3.8, 0.26, "TEAM  /  ASTROCIRCUIT", 11, CYAN, True)
    text(slide, 0.72, 1.85, 7.0, 1.3, "Better context.\nSafer conversations.", 31, WHITE, True, valign="t")
    text(slide, 0.75, 3.55, 6.3, 0.78,
         "AstroHealth is a starting point for organizing crew health signals—not a replacement for mission medical care.",
         15, MUTED, valign="t")
    shape(slide, 7.55, 1.38, 4.95, 4.85, PANEL, line="1B3B5D", geometry="roundRect")
    text(slide, 7.98, 1.82, 4.1, 0.34, "WHERE WE NEED FEEDBACK", 10, CYAN, True)
    bullet(slide, 8.0, 2.52, "Mission fit", "Does this flow match the crew’s real decision context?", BLUE, 3.9)
    bullet(slide, 8.0, 3.55, "Evidence", "Which datasets and expert-reviewed references should guide validation?", GREEN, 3.9)
    bullet(slide, 8.0, 4.63, "Integration", "Which wearable and approved protocol should we target next?", AMBER, 3.9)
    text(slide, 0.75, 5.7, 6.4, 0.32, "ASTROHEALTH  ×  ASTROCIRCUIT", 15, CYAN, True)
    text(slide, 0.75, 6.16, 6.3, 0.3, "Thank you  •  Questions & discussion", 12, WHITE)


def slide_xml(slide):
    group = (
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
        '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        f'<p:cSld><p:spTree>{group}{"".join(slide["shapes"])}</p:spTree></p:cSld>'
        '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'
    )


def package():
    make_deck()
    with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as archive:
        content_overrides = [
            '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
            '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
            '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
            '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
        ]
        for index in range(1, len(slides) + 1):
            content_overrides.append(
                f'<Override PartName="/ppt/slides/slide{index}.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
            )
        content_types = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Default Extension="png" ContentType="image/png"/>'
            f'{"".join(content_overrides)}</Types>'
        )
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr(
            "_rels/.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
            '</Relationships>',
        )
        slide_ids = "".join(
            f'<p:sldId id="{255 + i}" r:id="rId{i + 1}"/>'
            for i in range(1, len(slides) + 1)
        )
        archive.writestr(
            "ppt/presentation.xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
            f'<p:sldIdLst>{slide_ids}</p:sldIdLst>'
            f'<p:sldSz cx="{emu(WIDTH)}" cy="{emu(HEIGHT)}" type="screen16x9"/>'
            '<p:notesSz cx="6858000" cy="9144000"/>'
            '<p:defaultTextStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:defaultTextStyle>'
            '</p:presentation>',
        )
        presentation_rels = [
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
        ]
        for index in range(1, len(slides) + 1):
            presentation_rels.append(
                f'<Relationship Id="rId{index + 1}" '
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" '
                f'Target="slides/slide{index}.xml"/>'
            )
        archive.writestr(
            "ppt/_rels/presentation.xml.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            f'{"".join(presentation_rels)}</Relationships>',
        )
        archive.writestr("ppt/slideMasters/slideMaster1.xml", master_xml())
        archive.writestr(
            "ppt/slideMasters/_rels/slideMaster1.xml.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
            '</Relationships>',
        )
        archive.writestr("ppt/slideLayouts/slideLayout1.xml", layout_xml())
        archive.writestr(
            "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
            '</Relationships>',
        )
        archive.writestr("ppt/theme/theme1.xml", theme_xml())
        for index, slide in enumerate(slides, start=1):
            archive.writestr(f"ppt/slides/slide{index}.xml", slide_xml(slide))
            relationships = [
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
            ]
            if slide["image"]:
                relationships.append(
                    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/anatomy.png"/>'
                )
            archive.writestr(
                f"ppt/slides/_rels/slide{index}.xml.rels",
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                f'{"".join(relationships)}</Relationships>',
            )
        archive.write(ANATOMY_IMAGE, "ppt/media/anatomy.png")


def master_xml():
    group = (
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
        '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        f'<p:cSld><p:spTree>{group}</p:spTree></p:cSld>'
        '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" '
        'accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
        '<p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst>'
        '<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>'
    )


def layout_xml():
    group = (
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
        '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">'
        f'<p:cSld name="Blank"><p:spTree>{group}</p:spTree></p:cSld>'
        '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'
    )


def theme_xml():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="AstroHealth">'
        '<a:themeElements><a:clrScheme name="AstroHealth">'
        '<a:dk1><a:srgbClr val="071426"/></a:dk1><a:lt1><a:srgbClr val="F4F8FF"/></a:lt1>'
        '<a:dk2><a:srgbClr val="0D2038"/></a:dk2><a:lt2><a:srgbClr val="A8B9CF"/></a:lt2>'
        '<a:accent1><a:srgbClr val="59D8E8"/></a:accent1><a:accent2><a:srgbClr val="78AFFF"/></a:accent2>'
        '<a:accent3><a:srgbClr val="72E0B4"/></a:accent3><a:accent4><a:srgbClr val="FFC66D"/></a:accent4>'
        '<a:accent5><a:srgbClr val="FF8294"/></a:accent5><a:accent6><a:srgbClr val="19324D"/></a:accent6>'
        '<a:hlink><a:srgbClr val="59D8E8"/></a:hlink><a:folHlink><a:srgbClr val="78AFFF"/></a:folHlink>'
        '</a:clrScheme><a:fontScheme name="AstroHealth">'
        '<a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont>'
        '<a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme>'
        '<a:fmtScheme name="AstroHealth"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
        '</a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
        '</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
        '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>'
        '</a:fmtScheme></a:themeElements></a:theme>'
    )


if __name__ == "__main__":
    package()
    print(OUTPUT)
