import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const CONTRIBUTION_RULE = /\.c\.(c[0-9a-z]+)\{([^{}]*)\}/g;

export function limitSnakeBites(svg, interval) {
  if (!Number.isInteger(interval) || interval <= 0) {
    throw new TypeError("Bite interval must be a positive integer.");
  }

  let animatedCells = 0;
  const transformed = svg.replace(
    CONTRIBUTION_RULE,
    (rule, id, declarations) => {
      const animationName = `animation-name:${id}`;
      if (!declarations.includes(animationName)) return rule;

      const shouldBeEaten = animatedCells % interval === 0;
      animatedCells += 1;

      if (shouldBeEaten) return rule;

      const staticDeclarations = declarations.replace(
        new RegExp(`${animationName};?`),
        "",
      );
      return `.c.${id}{${staticDeclarations}}`;
    },
  );

  if (animatedCells === 0) {
    throw new Error("SVG contains no animated contribution cells.");
  }

  return transformed.replace(/\.u\{(?!display:none;)/, ".u{display:none;");
}

async function main() {
  const [rawInterval, ...files] = process.argv.slice(2);
  const interval = Number(rawInterval);

  if (!rawInterval || files.length === 0) {
    throw new Error(
      "Usage: node scripts/limit-snake-bites.mjs <interval> <svg-file> [svg-file...]",
    );
  }

  const transformedFiles = await Promise.all(
    files.map(async (file) => ({
      file,
      content: limitSnakeBites(await readFile(file, "utf8"), interval),
    })),
  );

  await Promise.all(
    transformedFiles.map(({ file, content }) => writeFile(file, content)),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
