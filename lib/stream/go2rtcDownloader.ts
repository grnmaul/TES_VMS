import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

const GO2RTC_VERSION = 'v1.9.8';

function getDownloadUrl() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32') {
    return `https://github.com/AlexxIT/go2rtc/releases/download/${GO2RTC_VERSION}/go2rtc_win64.zip`;
  } else if (platform === 'linux') {
    if (arch === 'arm64') return `https://github.com/AlexxIT/go2rtc/releases/download/${GO2RTC_VERSION}/go2rtc_linux_arm64`;
    return `https://github.com/AlexxIT/go2rtc/releases/download/${GO2RTC_VERSION}/go2rtc_linux_amd64`;
  } else if (platform === 'darwin') {
    if (arch === 'arm64') return `https://github.com/AlexxIT/go2rtc/releases/download/${GO2RTC_VERSION}/go2rtc_mac_arm64`;
    return `https://github.com/AlexxIT/go2rtc/releases/download/${GO2RTC_VERSION}/go2rtc_mac_amd64`;
  }
  throw new Error(`Unsupported platform: ${platform} ${arch}`);
}

function getExecutableName() {
  return process.platform === 'win32' ? 'go2rtc.exe' : 'go2rtc';
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location as string, dest).then(resolve).catch(reject);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

export async function ensureGo2rtc(): Promise<string> {
  const binDir = path.join(process.cwd(), 'bin');
  const exePath = path.join(binDir, getExecutableName());

  if (fs.existsSync(exePath)) {
    return exePath;
  }

  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  console.log(`[go2rtc] Downloading go2rtc ${GO2RTC_VERSION}...`);
  const url = getDownloadUrl();
  
  if (url.endsWith('.zip')) {
    const zipPath = path.join(binDir, 'go2rtc.zip');
    await downloadFile(url, zipPath);
    // Extract zip using powershell or tar (tar works on modern windows)
    console.log('[go2rtc] Extracting...');
    try {
      execSync(`tar -xf "${zipPath}" -C "${binDir}"`);
    } catch (e) {
      console.log('Failed to extract with tar, trying powershell');
      execSync(`powershell -command "Expand-Archive -Force '${zipPath}' '${binDir}'"`);
    }
    fs.unlinkSync(zipPath);
  } else {
    await downloadFile(url, exePath);
    if (process.platform !== 'win32') {
      execSync(`chmod +x "${exePath}"`);
    }
  }

  console.log('[go2rtc] Ready.');
  return exePath;
}
