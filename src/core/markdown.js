function unique(items = []) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function formatProjectName(title = '') {
  const normalized = String(title || '')
    .replace(/\s*DESIGN\.md$/i, '')
    .replace(/^www\./i, '')
    .trim();

  return normalized || 'Current Page';
}

function parseHexColor(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const match = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!match) {
    return null;
  }

  const [r, g, b] = [0, 2, 4].map((offset) =>
    Number.parseInt(match[1].slice(offset, offset + 2), 16),
  );

  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
  }

  hue = Math.round(hue * 60);
  if (hue < 0) {
    hue += 360;
  }

  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return {
    hex: normalized,
    hue,
    saturation,
    lightness,
    luminance,
  };
}

function getHueLabel(hue) {
  if (hue < 15 || hue >= 345) {
    return 'Rose';
  }
  if (hue < 40) {
    return 'Amber';
  }
  if (hue < 70) {
    return 'Gold';
  }
  if (hue < 150) {
    return 'Green';
  }
  if (hue < 190) {
    return 'Teal';
  }
  if (hue < 235) {
    return 'Blue';
  }
  if (hue < 275) {
    return 'Indigo';
  }
  if (hue < 315) {
    return 'Violet';
  }
  return 'Magenta';
}

function describeColorName(meta, fallbackIndex) {
  if (!meta) {
    return `Observed Color ${fallbackIndex + 1}`;
  }

  if (meta.saturation < 0.12) {
    if (meta.luminance >= 0.95) {
      return 'Pure White Neutral';
    }
    if (meta.luminance >= 0.82) {
      return 'Soft Mist Neutral';
    }
    if (meta.luminance >= 0.58) {
      return 'Balanced Gray Neutral';
    }
    if (meta.luminance >= 0.28) {
      return 'Deep Graphite Neutral';
    }
    return 'Near-Black Neutral';
  }

  const hueLabel = getHueLabel(meta.hue);
  if (meta.luminance >= 0.8) {
    return `Light ${hueLabel}`;
  }
  if (meta.luminance >= 0.55) {
    return `${hueLabel} Midtone`;
  }
  return `Deep ${hueLabel}`;
}

function getColorRole(meta, flags = {}) {
  if (!meta) {
    return 'Observed interface color; exact role needs manual verification.';
  }

  if (flags.isLightest) {
    return 'Primary surface or background candidate for large layout areas.';
  }
  if (flags.isDarkest) {
    return 'Primary text, icon, or high-contrast structural anchor.';
  }
  if (flags.isAccent) {
    return 'Accent or interactive highlight for CTA, active, or emphasis states.';
  }
  if (meta.luminance >= 0.78) {
    return 'Secondary surface, subtle fill, or quiet container treatment.';
  }
  if (meta.luminance <= 0.32) {
    return 'Secondary text, iconography, or high-contrast support tone.';
  }
  return 'Supporting UI color for dividers, muted emphasis, or secondary states.';
}

function buildColorEntries(colors = []) {
  const entries = unique(colors)
    .map((color, index) => ({
      raw: color,
      meta: parseHexColor(color),
      index,
    }))
    .filter((entry) => entry.meta);

  if (!entries.length) {
    return [];
  }

  const lightest = entries.reduce((best, entry) =>
    entry.meta.luminance > best.meta.luminance ? entry : best,
  );
  const darkest = entries.reduce((best, entry) =>
    entry.meta.luminance < best.meta.luminance ? entry : best,
  );
  const accent = entries
    .filter((entry) => entry.raw !== lightest.raw && entry.raw !== darkest.raw)
    .reduce(
      (best, entry) => (entry.meta.saturation > (best?.meta.saturation ?? -1) ? entry : best),
      null,
    );

  return entries.map((entry) => ({
    ...entry,
    hex: entry.meta.hex,
    name: describeColorName(entry.meta, entry.index),
    role: getColorRole(entry.meta, {
      isLightest: entry.raw === lightest.raw,
      isDarkest: entry.raw === darkest.raw,
      isAccent: entry.raw === accent?.raw,
    }),
  }));
}

function renderBulletList(items = []) {
  if (!items.length) {
    return '- Evidence was limited in this capture.';
  }

  return items.map((item) => `- ${item}`).join('\n');
}

function buildKeyCharacteristics(report) {
  const items = [];
  const primaryFont = report.tokens?.typography?.[0];
  const colors = report.tokens?.colors || [];
  const radii = report.tokens?.radii || [];
  const shadows = report.tokens?.shadows || [];
  const components = report.components || {};

  if (colors.length) {
    items.push(`Observed palette is anchored by ${colors.length} reusable color cues rather than a single flat monochrome treatment.`);
  }
  if (primaryFont) {
    items.push(`Typography appears to center on ${primaryFont}, giving the interface a consistent voice across headings and UI labels.`);
  }
  if (components.cards > 0) {
    items.push(`Card-driven information grouping is prominent, with ${components.cards} visible card-like containers in the sampled page.`);
  }
  if (components.buttons > 0) {
    items.push(`Action hierarchy is visible through ${components.buttons} detected button-like controls, suggesting clear primary and secondary pathways.`);
  }
  if (radii.length) {
    items.push(`Corner treatment is part of the visual language, with observed radius values such as ${radii.slice(0, 3).join(', ')}.`);
  }
  if (shadows.length) {
    items.push('Depth is not flat; elevation cues are present and contribute to surface separation.');
  }
  if ((report.layout || []).length) {
    items.push(`Layout rhythm is structured around ${report.layout.slice(0, 3).join(', ')}.`);
  }

  return items;
}

function buildAtmosphere(report) {
  const pageTypeDescriptions = {
    marketing:
      'The page reads like a conversion-oriented marketing surface: it aims to lead the user through value, trust, and action with a deliberate hierarchy.',
    documentation:
      'The page feels information-first and reference-oriented, prioritizing scanability, hierarchy, and durable reading comfort over theatrical visual gestures.',
    dashboard:
      'The interface carries a utilitarian, operational atmosphere where density, quick recognition, and strong content grouping matter more than decorative flourish.',
    application:
      'The page behaves like an interactive product surface, balancing clarity, task flow, and repeated UI patterns rather than hero-first storytelling.',
  };

  const visualDensity =
    (report.components?.cards || 0) >= 4 || (report.components?.links || 0) >= 8
      ? 'fairly dense'
      : 'moderately airy';
  const imagePresence =
    (report.components?.images || 0) > 0
      ? 'Visual content is supported by imagery, which adds emphasis and pacing to the layout.'
      : 'The page leans more on typography, spacing, and structural grouping than on image-heavy storytelling.';
  const shadowNote =
    (report.tokens?.shadows || []).length > 0
      ? 'Elevation is used to separate surfaces rather than leaving the composition completely flat.'
      : 'Depth cues are restrained, so the composition relies more on spacing and contrast than on heavy elevation.';

  return [
    pageTypeDescriptions[report.overview?.pageType] ||
      'The page presents a structured interface with a clear visual hierarchy and repeated design cues.',
    `Overall density is ${visualDensity}, with reusable layout modules shaping the reading flow.`,
    imagePresence,
    shadowNote,
  ].join(' ');
}

function buildTypographyHierarchy(report) {
  const fonts = unique(report.tokens?.typography || []);
  const primary = fonts[0] || 'Observed primary sans-serif';
  const secondary = fonts[1] || primary;
  const bodyWeight = report.overview?.pageType === 'documentation' ? '400-500 (inferred)' : '400-600 (inferred)';
  const displayWeight =
    report.overview?.pageType === 'marketing' ? '600-700 (inferred)' : '500-700 (inferred)';

  return [
    '| Role | Font | Weight | Notes |',
    '| --- | --- | --- | --- |',
    `| Display / Section Heading | ${primary} | ${displayWeight} | Larger headings likely carry the main brand voice and sectional pacing. |`,
    `| UI Label / Button | ${primary} | 500-600 (inferred) | Repeated controls usually need firmer weight for action clarity. |`,
    `| Body / Supporting Copy | ${secondary} | ${bodyWeight} | Reading content should remain calmer than headings and actions. |`,
    `| Caption / Metadata | ${secondary} | 400-500 (inferred) | Smaller helper text should stay visually subordinate. |`,
  ].join('\n');
}

function buildTypographyPrinciples(report) {
  const fonts = unique(report.tokens?.typography || []);
  const principles = [];

  if (fonts.length === 1) {
    principles.push(`The captured evidence suggests a mostly single-family system built around ${fonts[0]}, so hierarchy likely depends more on size, weight, and spacing than on contrastive font pairing.`);
  } else if (fonts.length > 1) {
    principles.push(`Typography likely separates voice and utility: ${fonts[0]} appears suited to headings/UI, while ${fonts[1]} can support body or secondary reading states.`);
  } else {
    principles.push('Typography evidence is limited, so hierarchy should be validated manually before treating it as a locked design token.');
  }

  principles.push('Preserve a clear difference between display emphasis and everyday UI text rather than flattening the whole interface into one weight.');
  principles.push('If the design is extended, keep button, navigation, and section-heading weights aligned so action hierarchy feels intentional.');

  return principles;
}

function buildLayoutSpacing(report) {
  const spacing = report.tokens?.spacing || [];
  if (spacing.length) {
    return `The extracted spacing rhythm suggests a reusable scale around ${spacing.join(', ')}, which is enough to guide section padding, card gutters, and content cadence.`;
  }

  return 'Exact spacing tokens were not captured, but the page still shows a repeatable rhythm between structural blocks, controls, and supporting copy.';
}

function buildWhitespacePhilosophy(report) {
  if (report.overview?.pageType === 'marketing') {
    return 'Whitespace is likely being used to stage persuasion: hero messaging, proof, and conversion moments need enough breathing room to read as deliberate beats instead of one continuous wall of information.';
  }
  if (report.overview?.pageType === 'dashboard') {
    return 'Whitespace appears calibrated for utility: enough separation to prevent crowding, but not so much that information density collapses or dashboard scanning slows down.';
  }
  if (report.overview?.pageType === 'documentation') {
    return 'Whitespace supports reading endurance more than spectacle, keeping headings, paragraphs, and supporting lists distinct without creating unnecessary visual drama.';
  }

  return 'Whitespace is functioning as structure first: it clarifies task flow, groups related content, and helps users recognize where one interaction cluster ends and the next begins.';
}

function buildRadiusBullets(radii = []) {
  return unique(radii).map((radius) => {
    if (radius === '999px' || radius === '50%') {
      return `Circle / Pill (${radius}): Used where controls need a softer, more tactile outline.`;
    }
    return `Observed Radius (${radius}): Reuse this value family for buttons, inputs, cards, or image masks where appropriate.`;
  });
}

function buildDepthRows(shadows = []) {
  const uniqueShadows = unique(shadows);
  if (!uniqueShadows.length) {
    return [
      '| Level | Treatment | Use |',
      '| --- | --- | --- |',
      '| Level 0 | No reliable shadow evidence captured | Treat surfaces as mostly flat until inspected manually. |',
    ].join('\n');
  }

  return [
    '| Level | Treatment | Use |',
    '| --- | --- | --- |',
    ...uniqueShadows.slice(0, 3).map((shadow, index) => {
      const label = `Level ${index + 1}`;
      let use = 'Stronger emphasis moment, modal, or featured card treatment.';
      if (index === 0) {
        use = 'Light separation for cards, inputs, or sticky surfaces.';
      } else if (index === 1) {
        use = 'Interactive hover or elevated container state.';
      }
      return `| ${label} | \`${shadow}\` | ${use} |`;
    }),
  ].join('\n');
}

function buildDos(report, colors) {
  const dos = [];
  const fonts = report.tokens?.typography || [];

  if (colors[0]) {
    dos.push(`Keep ${colors[0].hex} available as a stable surface or anchor tone when extending this system.`);
  }
  if (fonts[0]) {
    dos.push(`Reuse ${fonts[0]} consistently for core UI roles before introducing a new type voice.`);
  }
  if ((report.tokens?.radii || []).length) {
    dos.push('Preserve the observed radius family so new surfaces feel native to the current component language.');
  }
  if ((report.tokens?.shadows || []).length) {
    dos.push('Match the existing shadow softness and spread instead of introducing heavier, unrelated elevation styles.');
  }
  if ((report.components?.buttons || 0) > 0) {
    dos.push('Maintain a clear primary-versus-secondary CTA split so action hierarchy stays readable.');
  }

  return dos;
}

function buildDonts(report, colors) {
  const donts = [];

  if (colors[2]) {
    donts.push(`Don't overuse ${colors[2].hex} across large surfaces if it behaves more like an accent than a foundation.`);
  }
  if ((report.tokens?.radii || []).length) {
    donts.push("Don't introduce a conflicting corner system that makes cards, inputs, and buttons feel like they came from different products.");
  }
  if ((report.recommendations || []).length) {
    donts.push(
      ...report.recommendations.slice(0, 2).map((item) =>
        item.replace(/^建议/, "Don't leave").replace(/。$/, ''),
      ),
    );
  }

  donts.push("Don't treat inferred responsive or typography details as final tokens without verifying them in more than one viewport.");
  return donts;
}

function buildResponsiveBullets(report) {
  const bullets = [];

  bullets.push('This analysis comes from a single captured viewport, so breakpoint behavior below is inferred rather than fully verified.');
  if ((report.components?.navigation || 0) > 0) {
    bullets.push('Navigation likely compresses before content modules do; preserve a clear mobile fallback for menus, filters, or account actions.');
  }
  if ((report.components?.cards || 0) > 1) {
    bullets.push('Card collections should collapse from multi-column groupings toward single-column stacking while preserving scan order and CTA visibility.');
  }
  if ((report.components?.buttons || 0) > 0) {
    bullets.push('Primary actions should remain thumb-reachable and visually dominant when the layout narrows.');
  }
  if ((report.components?.images || 0) > 0) {
    bullets.push('Image crops need to preserve focal points as containers resize, especially if cards or hero areas become taller on mobile.');
  }

  return bullets;
}

function buildPromptExamples(report, colors) {
  const primaryText = colors.find((entry) => entry.role.includes('text')) || colors[1] || colors[0];
  const accent = colors.find((entry) => entry.role.includes('Accent')) || colors[2] || colors[0];
  const radius = report.tokens?.radii?.[0] || '16px';
  const shadow = report.tokens?.shadows?.[0] || 'subtle soft shadow';
  const font = report.tokens?.typography?.[0] || 'the primary observed UI font';

  return [
    `"Create a primary CTA button using ${accent?.hex || 'the observed accent color'} on the background, ${primaryText?.hex || '#111111'} for supporting contrast decisions, ${radius} corner rounding, and ${font} for the label."`,
    `"Design a content card with ${radius} radius, ${shadow} elevation, a clear heading/body split, and spacing that follows the observed rhythm from the current page."`,
    `"Build a section header that keeps the current product's typography voice, uses existing spacing cadence, and preserves the same contrast hierarchy between title, supporting copy, and action."`,
  ];
}

function buildIterationGuide(report, colors) {
  const guide = [];

  guide.push(`Start with the observed surface and text anchors: ${colors.slice(0, 2).map((entry) => entry.hex).join(', ') || 'validate the base palette first'}.`);
  guide.push('Lock typography voice and corner radius before inventing new component variants.');
  guide.push('Extend the system by repeating the current card, button, and spacing logic rather than adding unrelated visual ideas.');
  guide.push('Validate inferred responsive behavior in at least one smaller and one larger viewport before freezing new layout tokens.');

  if ((report.tokens?.shadows || []).length) {
    guide.push('Keep elevation restrained and reuse the same shadow family so depth feels consistent across the product.');
  }

  return guide;
}

function renderAppendix(report) {
  if (!report.includeAuditAppendix || !(report.appendix || []).length) {
    return '';
  }

  return ['## Appendix', renderBulletList(report.appendix), ''].join('\n\n');
}

export function buildDesignMarkdown(report) {
  const projectName = formatProjectName(report.title);
  const colors = buildColorEntries(report.tokens?.colors || []);
  const fonts = unique(report.tokens?.typography || []);
  const primaryFont = fonts[0] || 'Not clearly identifiable from the captured sample';
  const secondaryFont = fonts[1] || primaryFont;
  const responsiveBullets = buildResponsiveBullets(report);

  return [
    `# Design System Inspiration of ${projectName}`,
    '',
    '## 1. Visual Theme & Atmosphere',
    '',
    buildAtmosphere(report),
    '',
    '**Key Characteristics:**',
    renderBulletList(buildKeyCharacteristics(report)),
    '',
    '## 2. Color Palette & Roles',
    '',
    renderBulletList(
      colors.map((entry) => `**${entry.name}** (\`${entry.hex}\`): ${entry.role}`),
    ),
    '',
    '## 3. Typography Rules',
    '',
    '### Font Family',
    renderBulletList([
      `**Primary**: ${primaryFont}`,
      `**Secondary / Supporting**: ${secondaryFont}`,
    ]),
    '',
    '### Hierarchy',
    buildTypographyHierarchy(report),
    '',
    '### Principles',
    renderBulletList(buildTypographyPrinciples(report)),
    '',
    '## 4. Component Stylings',
    '',
    '### Buttons',
    renderBulletList([
      `${report.components?.buttons || 0} button-like controls were detected, so action styling is part of the page language rather than an edge case.`,
      `Use ${colors.find((entry) => entry.role.includes('Accent'))?.hex || 'the observed accent tone'} for primary emphasis and keep supporting actions calmer.`,
      `Observed corner treatment suggests buttons should align with the existing radius family: ${(report.tokens?.radii || []).slice(0, 2).join(', ') || 'manual verification needed'}.`,
    ]),
    '',
    '### Cards & Containers',
    renderBulletList([
      `${report.components?.cards || 0} card-like groupings were detected in the sampled layout.`,
      `Container styling should preserve the current balance between surface contrast and elevation: ${(report.tokens?.shadows || []).slice(0, 1).join(', ') || 'largely flat surfaces were observed'}.`,
      'When extending the system, keep cards visibly related through shared radius, padding rhythm, and heading/body structure.',
    ]),
    '',
    '### Inputs',
    renderBulletList([
      (report.components?.forms || 0) > 0
        ? `The page includes ${(report.components?.forms || 0)} form region(s), so input treatment should be considered a first-class component.`
        : 'Form evidence is limited, so input styling should be inferred carefully from buttons, cards, and text-field-like surfaces.',
      'Inputs should reuse the same border, fill, and radius vocabulary instead of introducing a separate control system.',
    ]),
    '',
    '### Navigation',
    renderBulletList([
      (report.components?.navigation || 0) > 0
        ? 'A global navigation structure is present and should remain one of the strongest alignment anchors in the interface.'
        : 'Navigation structure was not strongly represented in the capture, so hierarchy should be checked manually.',
      'Link density and action labeling suggest navigation should emphasize scanability before decorative motion.',
    ]),
    '',
    '### Image Treatment',
    renderBulletList([
      (report.components?.images || 0) > 0
        ? `${report.components?.images} image element(s) were captured, which means imagery contributes to hierarchy and pacing.`
        : 'Image evidence is minimal, so the system appears to rely more on typography and surface treatment than photography.',
      'Any future media blocks should inherit the same radius and crop discipline as existing visual surfaces.',
    ]),
    '',
    '## 5. Layout Principles',
    '',
    '### Spacing System',
    buildLayoutSpacing(report),
    '',
    '### Grid & Container',
    renderBulletList(report.layout),
    '',
    '### Whitespace Philosophy',
    buildWhitespacePhilosophy(report),
    '',
    '### Border Radius Scale',
    renderBulletList(buildRadiusBullets(report.tokens?.radii || [])),
    '',
    '## 6. Depth & Elevation',
    '',
    buildDepthRows(report.tokens?.shadows || []),
    '',
    `**Shadow Philosophy**: ${(report.tokens?.shadows || []).length > 0
      ? 'Observed shadows should be treated as a reusable family. Keep blur, spread, and opacity in the same neighborhood so elevated surfaces feel related rather than arbitrarily stacked.'
      : 'The page appears visually restrained, so new elevation should be introduced sparingly and only when it improves hierarchy.'}`,
    '',
    "## 7. Do's and Don'ts",
    '',
    '### Do',
    renderBulletList(buildDos(report, colors)),
    '',
    "### Don't",
    renderBulletList(buildDonts(report, colors)),
    '',
    '## 8. Responsive Behavior',
    '',
    '### Breakpoints',
    renderBulletList(responsiveBullets),
    '',
    '### Touch Targets',
    renderBulletList([
      'Treat primary buttons, navigation toggles, and any filter controls as mobile-critical tap targets.',
      'If cards themselves are clickable, preserve full-card tap behavior rather than shrinking interaction to tiny nested links.',
    ]),
    '',
    '### Collapsing Strategy',
    renderBulletList([
      'Collapse from multi-column groupings toward vertical stacking while preserving the reading order established in desktop layout.',
      'Move non-essential secondary actions below primary content before compressing CTA prominence.',
      'Keep supporting metadata and helper text attached to their parent module instead of scattering them into separate rows.',
    ]),
    '',
    '### Image Behavior',
    renderBulletList([
      'Preserve stable aspect ratios when cards compress, especially if media is acting as a scannable thumbnail or trust-building proof.',
      'Prefer crop consistency over aggressive resizing that changes the perceived weight of adjacent modules.',
    ]),
    '',
    '## 9. Agent Prompt Guide',
    '',
    '### Quick Color Reference',
    renderBulletList(
      colors.map((entry) => `${entry.name}: \`${entry.hex}\``),
    ),
    '',
    '### Example Component Prompts',
    renderBulletList(buildPromptExamples(report, colors)),
    '',
    '### Iteration Guide',
    buildIterationGuide(report, colors)
      .map((item, index) => `${index + 1}. ${item}`)
      .join('\n'),
    '',
    renderAppendix(report),
  ]
    .filter(Boolean)
    .join('\n');
}
