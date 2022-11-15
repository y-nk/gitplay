import { exec } from "child_process";
import * as vscode from 'vscode';

export type GitPlayContext = {
  $: (shell: string) => Promise<string[]>
  currentSha: string
  rootPath: string
};

async function execShell(cmd: string, cwd: string) {
  return new Promise<string[]>((resolve, reject) => {
    exec(cmd, { cwd }, (err, out) => {
      if (err) {
        reject(err);
      } else {
        resolve(out.replace(/\n$/gi, '').split('\n'));
      }
    });
  });
}

export async function getContext(): Promise<GitPlayContext> {
  const rootPath = vscode.workspace.workspaceFolders?.[0].uri.path ?? '.';

  const $: GitPlayContext['$'] = shell => execShell(shell, rootPath);
  const [currentSha] = await $('git rev-parse HEAD');

  return { $, currentSha, rootPath };
}
