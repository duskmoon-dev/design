// Full gallery diagnostics; Sunshine and all themes' brand/semantic filled labels are enforced in check/CI.
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { assessPalette } from './palette';
import { oklchToLinearSrgb } from './color';

for (const name of ['sunshine', 'moonlight', 'forest', 'ocean']) {
  const { colors } = parse(readFileSync(join(import.meta.dir, '..', 'tokens', `${name}.yaml`), 'utf8'));
  const report = assessPalette(colors);
  const channels = Object.values(colors).flatMap(value => oklchToLinearSrgb(value as string));
  console.log(JSON.stringify({ name,
    scope: name === 'sunshine' ? 'Required Sunshine contexts' : 'Required brand/semantic filled labels; remaining Sunshine gallery contexts are diagnostic',
    linearRange: [Math.min(...channels), Math.max(...channels)],
    gamutFailures: report.gamutFailures,
    minimumText: Math.min(...report.contrasts.filter(c => c.minimum === 4.5).map(c => c.ratio)),
    minimumCue: Math.min(...report.contrasts.filter(c => c.minimum === 3).map(c => c.ratio)),
    contrastFailures: report.contrasts.filter(c => !c.pass),
  }, null, 2));
}
