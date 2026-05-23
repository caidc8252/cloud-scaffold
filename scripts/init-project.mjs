import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const templatesRoot = join(repoRoot, "templates");
const baseTemplateRoot = join(templatesRoot, "base");
const featureTemplateRoot = join(templatesRoot, "features");

const FEATURES = ["redis", "i18n", "storage"];
const FEATURE_PACKAGE_SCRIPTS = {};
const FEATURE_ROOT_DEPENDENCIES = {};
const FEATURE_ROOT_DEV_DEPENDENCIES = {};

function slugify(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "cloud-app"
  );
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];

    if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = "true";
    }
  }

  return args;
}

async function promptIfMissing(question, fallback, rl) {
  if (!rl) {
    return fallback;
  }

  const suffix = fallback ? ` (${fallback})` : "";
  const answer = await rl.question(`${question}${suffix}: `);
  return answer.trim() || fallback;
}

async function resolveConfig() {
  const args = parseArgs(process.argv.slice(2));
  const canPrompt = input.isTTY && output.isTTY;
  const rl = canPrompt ? createInterface({ input, output }) : null;

  try {
    const projectName =
      args.name || (await promptIfMissing("Project name", "Cloud Scaffold App", rl));
    const projectSlug = slugify(args.slug || projectName);
    const appName = slugify(args.app || (await promptIfMissing("Default app name", "web", rl)));
    const appPort = String(args.port || (await promptIfMissing("Default app port", "3000", rl)));
    const featureInput =
      args.features ||
      (await promptIfMissing(
        "Optional features (comma-separated: redis, i18n, storage)",
        "",
        rl,
      ));
    const features = featureInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .filter((value) => FEATURES.includes(value));
    const target = resolve(args.target || join(repoRoot, "generated", projectSlug));
    const force = args.force === "true";

    return {
      projectName,
      projectSlug,
      appName,
      appPort,
      features,
      target,
      force,
    };
  } finally {
    rl?.close();
  }
}

function isSameOrWithinPath(parent, child) {
  return child === parent || child.startsWith(`${parent}${sep}`);
}

function assertSafeTarget(target) {
  const protectedPaths = [
    repoRoot,
    templatesRoot,
    baseTemplateRoot,
    featureTemplateRoot,
    join(repoRoot, "apps"),
    join(repoRoot, "packages"),
    join(repoRoot, "scripts"),
  ];

  if (protectedPaths.some((path) => isSameOrWithinPath(path, target))) {
    throw new Error(`Refusing to write scaffold into protected path: ${target}`);
  }

  if (!isSameOrWithinPath(repoRoot, target)) {
    return;
  }

  if (!isSameOrWithinPath(join(repoRoot, "generated"), target)) {
    throw new Error(
      "Refusing to write inside the repository unless the target is under generated/ or outside the repo.",
    );
  }
}

async function ensureCleanTarget(target, force) {
  assertSafeTarget(target);

  if (await exists(target)) {
    if (!force) {
      throw new Error(
        `Target already exists: ${target}. Re-run with --force true to overwrite it.`,
      );
    }
    await rm(target, { recursive: true, force: true });
  }

  await mkdir(target, { recursive: true });
}

async function copyDir(source, target) {
  await mkdir(target, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else {
      await cp(sourcePath, targetPath);
    }
  }
}

async function renameTemplatePaths(root, appName) {
  const appTemplatePath = join(root, "apps", "__APP_NAME__");
  if (await exists(appTemplatePath)) {
    await cp(appTemplatePath, join(root, "apps", appName), { recursive: true });
    await rm(appTemplatePath, { recursive: true, force: true });
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function replaceTokens(root, replacements) {
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const targetPath = join(root, entry.name);

    if (entry.isDirectory()) {
      await replaceTokens(targetPath, replacements);
      continue;
    }

    const raw = await readFile(targetPath, "utf8");
    let next = raw;

    for (const [token, value] of Object.entries(replacements)) {
      next = next.split(token).join(value);
    }

    if (next !== raw) {
      await writeFile(targetPath, next, "utf8");
    }
  }
}

async function appendEnvFragment(targetRoot, featureName) {
  const fragmentPath = join(featureTemplateRoot, featureName, ".env.example.fragment");
  if (!(await exists(fragmentPath))) return;

  const fragment = await readFile(fragmentPath, "utf8");
  const envPath = join(targetRoot, ".env.example");
  const current = await readFile(envPath, "utf8");
  const next = `${current.trimEnd()}\n${fragment}`;
  await writeFile(envPath, next, "utf8");
}

async function mergeRootPackageJson(targetRoot, features, appName) {
  const packageJsonPath = join(targetRoot, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  packageJson.scripts[`dev:${appName}`] = `pnpm --filter ${appName} dev`;

  for (const feature of features) {
    Object.assign(packageJson.scripts, FEATURE_PACKAGE_SCRIPTS[feature] ?? {});
    Object.assign(packageJson.dependencies, FEATURE_ROOT_DEPENDENCIES[feature] ?? {});
    Object.assign(packageJson.devDependencies, FEATURE_ROOT_DEV_DEPENDENCIES[feature] ?? {});
  }

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

async function copyFeatures(targetRoot, features) {
  for (const feature of features) {
    const featureRoot = join(featureTemplateRoot, feature);
    if (!(await exists(featureRoot))) continue;

    const entries = await readdir(featureRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".env.example.fragment") continue;
      const sourcePath = join(featureRoot, entry.name);
      const targetPath = join(targetRoot, entry.name);

      if (entry.isDirectory()) {
        await copyDir(sourcePath, targetPath);
      } else {
        await mkdir(dirname(targetPath), { recursive: true });
        await cp(sourcePath, targetPath);
      }
    }

    await appendEnvFragment(targetRoot, feature);
  }
}

async function writeGeneratedReadme(targetRoot, features) {
  const readmePath = join(targetRoot, "README.md");
  const readme = await readFile(readmePath, "utf8");
  const featureLine =
    features.length > 0
      ? `\nSelected optional modules: ${features.join(", ")}.\n`
      : "\nSelected optional modules: none.\n";
  await writeFile(readmePath, `${readme.trimEnd()}\n${featureLine}`, "utf8");
}

async function copyProjectScripts(targetRoot) {
  const scriptsDir = join(targetRoot, "scripts");
  await mkdir(scriptsDir, { recursive: true });
  await cp(join(repoRoot, "scripts", "prisma.mjs"), join(scriptsDir, "prisma.mjs"));
}

async function generateProject() {
  const config = await resolveConfig();
  await ensureCleanTarget(config.target, config.force);
  await copyDir(baseTemplateRoot, config.target);
  await renameTemplatePaths(config.target, config.appName);
  await copyFeatures(config.target, config.features);
  await replaceTokens(config.target, {
    __PROJECT_NAME__: config.projectName,
    __PROJECT_SLUG__: config.projectSlug,
    __APP_NAME__: config.appName,
    __APP_PORT__: config.appPort,
  });
  await mergeRootPackageJson(config.target, config.features, config.appName);
  await writeGeneratedReadme(config.target, config.features);
  await copyProjectScripts(config.target);

  output.write(`\nGenerated scaffold at: ${config.target}\n`);
  output.write(`Project: ${config.projectName}\n`);
  output.write(`App: ${config.appName} (port ${config.appPort})\n`);
  output.write(`Features: ${config.features.join(", ") || "none"}\n`);
}

await generateProject();
