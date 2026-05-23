// @vitest-environment node

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(process.cwd());
const scriptPath = join(repoRoot, "scripts", "init-project.mjs");
const GENERATOR_TIMEOUT_MS = 20_000;

async function generate(args: string[]) {
  const targetRoot = await mkdtemp(join(tmpdir(), "cloud-scaffold-"));
  const target = join(targetRoot, "output");

  await execFileAsync("node", [scriptPath, "--target", target, ...args], {
    cwd: repoRoot,
  });

  return {
    targetRoot,
    target,
    cleanup: () => rm(targetRoot, { recursive: true, force: true }),
  };
}

describe("init-project scaffold generator", () => {
  it("generates the admin baseline project", async () => {
    const run = await generate(["--name", "Acme Portal", "--app", "web"]);

    try {
      const packageJson = JSON.parse(await readFile(join(run.target, "package.json"), "utf8"));
      const readme = await readFile(join(run.target, "README.md"), "utf8");
      const envExample = await readFile(join(run.target, ".env.example"), "utf8");
      const appPackageJson = JSON.parse(
        await readFile(join(run.target, "apps", "web", "package.json"), "utf8"),
      );
      const dbPackageJson = JSON.parse(
        await readFile(join(run.target, "packages", "db", "package.json"), "utf8"),
      );
      const securityPackageJson = JSON.parse(
        await readFile(join(run.target, "packages", "security", "package.json"), "utf8"),
      );
      const permissionsPackageJson = JSON.parse(
        await readFile(join(run.target, "packages", "permissions", "package.json"), "utf8"),
      );
      const prismaScript = await readFile(join(run.target, "scripts", "prisma.mjs"), "utf8");

      expect(packageJson.name).toBe("acme-portal");
      expect(packageJson.scripts.dev).toBe("pnpm --filter web dev");
      expect(packageJson.scripts["db:setup"]).toBeDefined();
      expect(readme).toContain("Selected optional modules: none.");
      expect(envExample).toContain("DATABASE_URL=");
      expect(envExample).toContain("AUTH_SESSION_SECRET=");
      expect(envExample).not.toContain("REDIS_URL=");
      expect(appPackageJson.name).toBe("web");
      expect(dbPackageJson.name).toBe("@cloud/db");
      expect(permissionsPackageJson.name).toBe("@cloud/permissions");
      expect(securityPackageJson.name).toBe("@cloud/security");
      expect(prismaScript).toContain("pnpmCommand");
    } finally {
      await run.cleanup();
    }
  }, GENERATOR_TIMEOUT_MS);

  it("adds Redis feature scaffolding when selected", async () => {
    const run = await generate(["--name", "Data Stack", "--app", "dashboard", "--features", "redis"]);

    try {
      const packageJson = JSON.parse(await readFile(join(run.target, "package.json"), "utf8"));
      const envExample = await readFile(join(run.target, ".env.example"), "utf8");
      const cachePackage = JSON.parse(
        await readFile(join(run.target, "packages", "cache", "package.json"), "utf8"),
      );

      expect(packageJson.scripts["db:generate"]).toBeDefined();
      expect(envExample).toContain("DATABASE_URL=");
      expect(envExample).toContain("REDIS_URL=");
      expect(cachePackage.name).toBe("@cloud/cache");
    } finally {
      await run.cleanup();
    }
  }, GENERATOR_TIMEOUT_MS);

  it("refuses to overwrite an existing target unless force is enabled", async () => {
    const targetRoot = await mkdtemp(join(tmpdir(), "cloud-scaffold-existing-"));
    const target = join(targetRoot, "output");

    try {
      await execFileAsync("node", [scriptPath, "--target", target, "--name", "First"], {
        cwd: repoRoot,
      });

      await expect(
        execFileAsync("node", [scriptPath, "--target", target, "--name", "Second"], {
          cwd: repoRoot,
        }),
      ).rejects.toThrow(/Target already exists/);

      await execFileAsync(
        "node",
        [scriptPath, "--target", target, "--name", "Second", "--force", "true"],
        {
          cwd: repoRoot,
        },
      );

      const packageJson = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
      expect(packageJson.name).toBe("second");
    } finally {
      await rm(targetRoot, { recursive: true, force: true });
    }
  }, GENERATOR_TIMEOUT_MS);

  it("refuses to write into protected repository directories", async () => {
    await expect(
      execFileAsync(
        "node",
        [scriptPath, "--target", join(repoRoot, "packages"), "--name", "Unsafe"],
        {
          cwd: repoRoot,
        },
      ),
    ).rejects.toThrow(/Refusing to write scaffold into protected path/);
  });
});
