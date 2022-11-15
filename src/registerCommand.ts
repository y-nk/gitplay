import { ExtensionContext, commands, window } from 'vscode';
import { GitPlayContext, getContext } from './getContext';

export function registerCommand(
  { subscriptions }: ExtensionContext,
  command: string,
  callback: (toolbox: GitPlayContext) => Promise<string | void>
) {
  subscriptions.push(
    commands.registerCommand(command, async () => {
      const context = await getContext();

      try {
        await callback(context);
      } catch (err) {
        console.error(err);

        if (err instanceof Error) {
          window.showErrorMessage(err.message);
        }
      }
    })
  );
}
