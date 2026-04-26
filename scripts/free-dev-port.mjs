import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const envPath = resolve(projectRoot, '.env');

const readPort = () => {
  if (!existsSync(envPath)) {
    return 5000;
  }

  const env = readFileSync(envPath, 'utf8');
  const match = env.match(/^\s*PORT\s*=\s*(\d+)\s*$/m);

  return match ? Number(match[1]) : 5000;
};

const port = readPort();

const runPowerShell = (command) => {
  try {
    execFileSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { stdio: 'inherit' },
    );
  } catch {
    // The dev server should still start if a stale process exits while cleanup is running.
  }
};

const stopWindowsProcesses = () => {
  const escapedRoot = projectRoot.replaceAll("'", "''");

  runPowerShell(`
$ErrorActionPreference = 'SilentlyContinue'
$port = ${port}
$projectRoot = '${escapedRoot}'
$selfNodePid = ${process.pid}
$processIds = New-Object System.Collections.Generic.HashSet[int]

Get-NetTCPConnection -LocalPort $port -State Listen | ForEach-Object {
  [void]$processIds.Add([int]$_.OwningProcess)
}

$processes = Get-CimInstance Win32_Process
$processes | Where-Object {
  $_.ProcessId -ne $PID -and
  $_.ProcessId -ne $selfNodePid -and
  $_.Name -in @('node.exe', 'cmd.exe', 'esbuild.exe') -and
  $_.CommandLine -and
  $_.CommandLine.Contains($projectRoot) -and
  (
    $_.CommandLine.Contains('tsx\\dist\\cli.mjs" watch src/server.ts') -or
    $_.CommandLine.Contains('tsx/dist/loader.mjs src/server.ts') -or
    $_.CommandLine.Contains('src/server.ts')
  )
} | ForEach-Object {
  [void]$processIds.Add([int]$_.ProcessId)
  if ($_.ParentProcessId -and $_.ParentProcessId -ne $selfNodePid -and $_.ParentProcessId -ne $PID) {
    [void]$processIds.Add([int]$_.ParentProcessId)
  }
}

$processIds | Where-Object { $_ -and $_ -ne $PID -and $_ -ne $selfNodePid } | ForEach-Object {
  Stop-Process -Id $_ -Force
}
`);
};

const stopUnixProcesses = () => {
  try {
    execFileSync('sh', ['-c', `lsof -ti tcp:${port} | xargs -r kill -9`], {
      stdio: 'inherit',
    });
  } catch {
    execFileSync('sh', ['-c', `fuser -k ${port}/tcp 2>/dev/null || true`], {
      stdio: 'inherit',
    });
  }
};

if (process.platform === 'win32') {
  stopWindowsProcesses();
} else {
  stopUnixProcesses();
}

process.exit(0);
