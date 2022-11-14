import * as vscode from 'vscode';

import { exec } from "child_process";

async function execShell(cmd: string, cwd: string) {
  return new Promise<string>((resolve, reject) => {
    exec(cmd, { cwd }, (err, out) => {
      if (err) {
        reject(err);
      } else {
        resolve(out.replace(/\n$/gi, ''));
      }
      err ? reject(err) : resolve(out);
    });
  });
}

type CommandToolbox = {
  $: (shell: string) => Promise<string>
  currentSha: string
};

function registerCommand(
  context: vscode.ExtensionContext,
  command: string,
  callback: (toolbox: CommandToolbox) => Promise<void>
) {
  const disposable = vscode.commands.registerCommand(command, async () => {
    const rootPath = vscode.workspace.workspaceFolders?.[0].uri.path;

    if (!rootPath) {
      vscode.window.showErrorMessage('no root path found');
      return;
    }

    try {
      const oldSha = await execShell('git rev-parse --short HEAD', rootPath!);

      await callback({
        $: shell => execShell(shell, rootPath!),
        currentSha: oldSha.replace('\n', ''),
      });

      const newSha = await execShell('git rev-parse --short HEAD', rootPath!);
      vscode.window.showInformationMessage(`now at #${newSha}`);
    } catch (err) {
      vscode.window.showErrorMessage(err as string);
    }
  });

  context.subscriptions.push(disposable);
}


export function activate(context: vscode.ExtensionContext) {
  registerCommand(context, 'gitplay.rewind', async ({ $, currentSha }) => {
    const rootSha = await $('git rev-list --max-parents=0 HEAD');

    if (currentSha !== rootSha) {
      await $('git clean -df');
      await $(`git checkout ${rootSha}`);
    }
  });

  registerCommand(context, 'gitplay.prev', async ({ $, currentSha }) => {
    const rootSha = await $('git rev-list --max-parents=0 HEAD');

    if (currentSha !== rootSha) {
      await $('git checkout HEAD~1 -f');
    }
  });

  registerCommand(context, 'gitplay.next', async ({ $, currentSha }) => {
    const lastSha = await $('git show-ref --hash');
    const revList = await $(`git rev-list --topo-order ${currentSha}..${lastSha}`);
    const allShas = revList.split('\n').reverse();

    const index = allShas.findIndex(sha => sha.startsWith(currentSha));

    if (index < allShas.length - 1) {
      const nextSha = allShas[index + 1];
      await $(`git checkout ${nextSha} -f`);
    }
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
