// Offline native DSH integration smoke test. No user profile or model adapters.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

if (!process.env.DSH_TEST_ANCHOR) {
  throw new Error('Set DSH_TEST_ANCHOR to the package.json of your installed @deepseek-ai/dsh.');
}
const anchor = resolve(process.env.DSH_TEST_ANCHOR);
const packageRoot = resolve(process.argv[2] ?? fileURLToPath(new URL('../', import.meta.url)));
const hostManifest = JSON.parse(readFileSync(anchor, 'utf8'));
assert.equal(hostManifest.name, '@deepseek-ai/dsh', 'Anchor must point to the DSH CLI package.');
const verifiedRuntimes = ['0.2.0-rc.2', '0.2.1-rc.5'];
assert.ok(verifiedRuntimes.includes(hostManifest.version),
  `This release is validated against ${verifiedRuntimes.join(' or ')}; got ${hostManifest.version}.`);
const requireDsh = createRequire(anchor);
const load = name => import(pathToFileURL(requireDsh.resolve(name)).href);
const timeout = setTimeout(() => {
  console.error('FAIL: native smoke exceeded 30 seconds');
  process.exit(124);
}, 30_000);

let networkAttempts = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkAttempts += 1;
  throw new Error('Offline smoke test prohibits network requests');
};

function inspectLegacyMount(ctx, registry, lease) {
  const mount = registry.livePresetMounts(ctx.fiber).find(row => row.key === lease.key);
  assert.ok(mount, 'Missing real mounted preset tree');
  const activeRows = [...mount.tree.entries()].filter(row => !row.disabled);
  for (const row of activeRows) {
    assert.ok(row.fiber, `${row.options.id} has no fiber`);
    assert.equal(row.fiber.state, 2, `${row.options.id} is not ACTIVE`);
  }
  return {
    ids: activeRows.map(row => row.options.id),
    names: activeRows.map(row => row.options.name),
    leaked: registry.leakedServices(ctx, mount.fiber),
    remaining: () => registry.livePresetMounts(ctx.fiber)
      .filter(row => row.presetId === 'ielts-writing-coach').length,
  };
}

async function inspectInventoryMount(ctx) {
  const inventory = await ctx.agentPresets.compositionInventory();
  const coach = inventory.find(row => row.id === 'ielts-writing-coach');
  assert.ok(coach, 'Missing composition inventory for ielts-writing-coach');
  assert.equal(coach.broken, undefined, coach.broken);
  const enabled = coach.rows.filter(row => row.enabled === true);
  for (const row of enabled) {
    assert.equal(row.fiberState, 2, `${row.entryId ?? row.moduleName} is not ACTIVE`);
  }
  const inspected = ctx.agentPresets.inspectCompositions()
    .filter(row => row.id === 'ielts-writing-coach');
  assert.ok(inspected.length > 0, 'Missing retained coach composition');
  return {
    ids: enabled.map(row => row.entryId),
    names: enabled.map(row => row.moduleName),
    leaked: inspected.flatMap(row => row.leakedServices),
    remaining: () => ctx.agentPresets.inspectCompositions()
      .filter(row => row.id === 'ielts-writing-coach').length,
  };
}

let ctx;
let lease;
try {
  const [cordis, loader, projection, registry, systemPrompt, appBoot, scope,
    tools, web, llm, sessions, tokenMeter, commands] = await Promise.all([
    '@deepseek-ai/cordis', '@deepseek-ai/cordis-plugin-loader',
    '@deepseek-ai/dsh-session-projection', '@deepseek-ai/dsh-agent-preset-registry',
    '@deepseek-ai/dsh-system-prompt', '@deepseek-ai/dsh-app-boot',
    '@deepseek-ai/dsh-scope', '@deepseek-ai/dsh-tools', '@deepseek-ai/dsh-web',
    '@deepseek-ai/dsh-llm', '@deepseek-ai/dsh-session',
    '@deepseek-ai/dsh-token-meter', '@deepseek-ai/dsh-commands',
  ].map(load));
  const patches = appBoot.loadOverlayPatches('native-smoke',
    resolve(packageRoot, 'cordis.patch.yml'));
  const entries = appBoot.composeEntries([patches]);
  assert.equal(entries.length, 1, 'Bundle must insert exactly one preset declaration');
  const declaration = entries[0];
  assert.equal(declaration.id, 'preset-ielts-writing-coach');
  assert.equal(declaration.name, '@deepseek-ai/dsh-agent-preset');
  assert.equal(declaration.config.id, 'ielts-writing-coach');
  const persona = declaration.config.plugins.find(row =>
    row.name === '@deepseek-ai/dsh-persona');
  assert.ok(persona?.config?.prefix?.length > 0, 'Missing full persona prompt');
  assert.equal(persona.config.complete, true);
  assert.equal(persona.config.includeRuntimeContext, false);
  const expectedPrompt = readFileSync(resolve(packageRoot, 'prompts/ielts-writing-coach.md'), 'utf8');
  assert.equal(persona.config.prefix, expectedPrompt, 'Bundle differs from the portable prompt.');

  ctx = new cordis.Context().extend({ baseUrl: pathToFileURL(anchor).href });
  const services = [
    [loader.default, {}], [projection.default, undefined],
    [registry.default, { default: 'standard' }],
    [systemPrompt.default, { personaPrefix: 'SMOKE_GLOBAL_PERSONA' }],
    [tools.default, { mode: 'native' }],
    // Real WebRuntime, with no search/fetch providers and no tool execution.
    [web.default, { searchProvider: 'offline-unregistered', fetchProvider: 'offline-unregistered' }],
    // Real empty LlmRuntime. No adapter, credential source, or request is installed.
    [llm.default, undefined], [sessions.default, undefined],
    [tokenMeter.default, {}], [commands.default, undefined],
  ];
  for (const [plugin, config] of services) await ctx.plugin(plugin, config).await();
  // The real app-boot host likewise installs this official Loader builtin.
  ctx.loader.builtins.group = loader.Group;
  assert.ok(ctx.loader.internal, 'Expected actual native ModuleLoader');
  ctx.systemPrompt.context({ name: 'smoke:global-context', order: 0,
    text: 'SMOKE_GLOBAL_RUNTIME_CONTEXT' });
  const globalBefore = await ctx.systemPrompt.assemble();
  const baselineDisposer = await ctx.agentPresets.register({
    id: 'standard', name: 'Untouched baseline preset',
    plugins: [{ id: 'baseline-persona', name: '@deepseek-ai/dsh-persona',
      config: { prefix: 'SMOKE_STANDARD_PERSONA', complete: true } }],
  });
  const baselineDocument = await ctx.agentPresets.readDocument('standard');
  await ctx.loader.root.update(entries);
  await ctx.loader.await();

  const roster = await ctx.agentPresets.list();
  assert.deepEqual(roster.map(row => row.id).sort(), ['ielts-writing-coach', 'standard']);
  for (const row of roster) assert.equal(row.broken, undefined,
    `Preset ${row.id} failed native diagnostic: ${row.broken}`);
  assert.equal(ctx.agentPresets.defaultId, 'standard');
  assert.deepEqual(await ctx.agentPresets.readDocument('standard'), baselineDocument);
  assert.deepEqual(await ctx.systemPrompt.assemble(), globalBefore,
    'Plugin polluted global prompt, contexts, or tool schemas');

  lease = await ctx.agentPresets.acquireScope('ielts-writing-coach');
  const assembly = await ctx.systemPrompt.assemble({ scope: lease.key });
  assert.equal(systemPrompt.renderPrompt(assembly), expectedPrompt,
    'Rendered coach system prompt differs from the complete declared prompt');
  assert.equal(assembly.sections.length, 1);
  assert.deepEqual(assembly.contexts, [], 'Persona did not suppress runtime context');
  assert.deepEqual(assembly.tools.map(tool => tool.name).sort(), ['web_fetch', 'web_search']);
  // 0.2.1-rc.5 removed the module-level livePresetMounts export. The preset
  // bundle is unchanged; only the test's inspection handle differs.
  const activeRows = typeof registry.livePresetMounts === 'function'
    ? inspectLegacyMount(ctx, registry, lease)
    : await inspectInventoryMount(ctx);
  assert.ok(activeRows.names.includes('@deepseek-ai/dsh-compaction-basic'));
  assert.ok(activeRows.names.includes('@deepseek-ai/dsh-command-compact'));
  assert.deepEqual(activeRows.leaked, []);
  assert.equal(ctx.get('compaction'), undefined, 'Compaction escaped its isolate realm');
  assert.equal(networkAttempts, 0);

  await lease[Symbol.asyncDispose]();
  lease = undefined;
  const declarationFiber = ctx.loader.resolve(declaration.id).fiber;
  ctx.loader.remove(declaration.id);
  await declarationFiber.dispose();
  assert.deepEqual((await ctx.agentPresets.list()).map(row => row.id), ['standard']);
  assert.equal(activeRows.remaining(), 0);
  assert.deepEqual(await ctx.systemPrompt.assemble(), globalBefore);
  assert.equal(scope.scopeOf(ctx), undefined);
  await baselineDisposer();
  assert.deepEqual(await ctx.agentPresets.list(), []);
  const pluginManifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
  assert.equal(appBoot.evaluatePluginCompatibility(pluginManifest, {}, hostManifest.version), undefined,
    `Verified runtime ${hostManifest.version} was rejected by its own compatibility check`);
  assert.ok(appBoot.evaluatePluginCompatibility(pluginManifest, {}, '0.2.1-rc.4'),
    'An unverified DSH runtime must remain incompatible');
  const manifest = JSON.parse(readFileSync(anchor, 'utf8'));
  console.log(JSON.stringify({ status: 'PASS', runtimeVersion: manifest.version,
    packageRoot, nativeModuleLoader: true, promptCharacters: expectedPrompt.length,
    activePresetRows: activeRows.ids,
    tools: assembly.tools.map(tool => tool.name).sort(),
    networkAttempts, mocks: [],
    verified: ['native patch loading', 'full preset activation diagnostic',
      'complete scoped prompt', 'runtime context suppression', 'web schema registration',
      'compaction engine and command activation', 'global and baseline preset isolation',
      'lease release', 'declaration disposal and mount cleanup'],
    notExecuted: ['model generation', 'web search/fetch', 'compaction summarization',
      'compact command execution', 'browser UI', 'user profile installation'],
  }, null, 2));
} finally {
  if (lease) await lease[Symbol.asyncDispose]();
  if (ctx) await ctx.fiber.dispose();
  globalThis.fetch = originalFetch;
  clearTimeout(timeout);
}
