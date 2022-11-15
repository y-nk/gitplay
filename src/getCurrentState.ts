import { GitPlayContext } from "./getContext";

export async function getCurrentState({ $, currentSha }: Pick<GitPlayContext, '$' | 'currentSha'>) {
  const [currentBranch] = (await $(`git branch --contains ${currentSha}`))
    .filter(str => !str.includes('HEAD'))
    .map(str => str.replace('*', '').trim());

  const [lastSha] = await $(`git rev-parse --short ${currentBranch}`);
  const allShas = await $(`git rev-list --topo-order --reverse ${lastSha}`);

  const index = allShas.findIndex(sha => sha.startsWith(currentSha));
  const percent = 100 * (index / (allShas.length - 1));

  const [message] = await $(`git log -1 --pretty=format:%s ${currentSha}`);

  return {
    currentSha,
    currentBranch,
    message,
    index,
    length: allShas.length,
    percent,
  };
}
