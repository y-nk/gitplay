import { ExtensionContext, workspace } from 'vscode';
import { GitPlayContext, getContext } from './getContext';

const DEBOUNCE_TIMEOUT = 10;

export async function registerWatcher(
  { subscriptions }: ExtensionContext,
  callback: (context: GitPlayContext) => Promise<string | void>
) {
  const { rootPath } = await getContext();
  const watcher = workspace.createFileSystemWatcher(`${rootPath}/.git/**/*`);

  let debounce = -1;

  const listener = async () => {
    if (Date.now() - debounce < DEBOUNCE_TIMEOUT) {
      return;
    }

    debounce = Date.now();
    const context = await getContext();
    await callback(context);
  };

  subscriptions.push(
    watcher.onDidCreate(listener),
    watcher.onDidChange(listener),
    watcher.onDidDelete(listener),
  );
}
