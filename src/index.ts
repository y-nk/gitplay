/* eslint-disable no-throw-literal */
import { ExtensionContext } from 'vscode';

import { registerCommand } from "./registerCommand";
import { registerWatcher } from "./registerWatcher";

import { getContext } from "./getContext";
import { getCurrentState } from "./getCurrentState";

import { ProgressToast } from './ProgressToast';

let toast: ProgressToast;
// toastProgress(`#${newSha}: ${message}`, percent);

export async function activate(_: ExtensionContext) {
  const context = await getContext();
  const state = await getCurrentState(context);

  toast = new ProgressToast('Git play', 0);
  toast.show(state.message, state.percent);

  registerCommand(_, 'gitplay.rewind', async ({ $, currentSha }) => {
    const [rootSha] = await $('git rev-list --max-parents=0 HEAD');

    if (currentSha !== rootSha) {
      await $('git clean -df');
      await $(`git checkout ${rootSha}`);

      return 'moved to root commit';
    }

    throw 'most backward reached';
  });

  registerCommand(_, 'gitplay.prev', async ({ $, currentSha }) => {
    const [rootSha] = await $('git rev-list --max-parents=0 HEAD');

    if (currentSha !== rootSha) {
      await $('git clean -df');
      await $('git checkout HEAD~1 -f');

      return 'moved backward';
    }

    throw 'most backward reached';
  });

  registerCommand(_, 'gitplay.next', async ({ $, currentSha }) => {
    const [lastSha] = await $('git show-ref --hash --heads');
    const revList = await $(`git rev-list --topo-order ${currentSha}..${lastSha}`);

    const allShas = [...revList]
      .reverse()
      .filter(sha => sha.length);

    if (!!allShas.length) {
      const nextSha = allShas[0];

      await $('git clean -df');
      await $(`git checkout ${nextSha} -f`);

      return 'moved forward';
    }

    throw 'most forward reached';
  });

  registerWatcher(_, async ({ $, currentSha }) => {
    const { message, percent } = await getCurrentState({ $, currentSha });
    toast.show(message, percent);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
