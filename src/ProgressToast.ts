import * as vscode from 'vscode';

export class ProgressToast {
  public modal: null | vscode.Progress<any> = null;

  constructor(
    public title: string,
    public value: number,
    public timeout: number = 5000,
  ) {}

  async show(message: string, value: number) {
    /**
     * here there's a little hack. we want to abuse the
     * notification progression to show where we are in
     * the presentation.
     *
     * sadly vscode implementation does not allow for setting
     * the progression as an absolute value, but only allow
     * incremental "step" instead.
     *
     * hopefully, if passed a certain value, the notification
     * toggles to "infinite" mode, which causes a visual glitch
     * but also resets the modal progress properly.
     *
     * see:
     * 1. https://github.com/microsoft/vscode/blob/a3c64dac8d7aa97e6571445b1233ab0cc014bc47/src/vs/workbench/services/progress/browser/progressService.ts#L343-L350
     * 2. https://github.com/microsoft/vscode/blob/a3c64dac8d7aa97e6571445b1233ab0cc014bc47/src/vs/workbench/common/notifications.ts#L339-L408
     */
    if (this.modal) {
      this.modal.report({ message, increment: -1 });
      this.modal.report({ message, increment: value });
      return;
    }

    vscode.window.withProgress({
      title: this.title,
      location: vscode.ProgressLocation.Notification,
    }, progress => {
      return new Promise<void>((resolve) => {
        this.modal = progress;

        this.modal.report({ message, increment: -1 });
        this.modal.report({ message, increment: value });

        setTimeout(() => {
          this.modal = null;
          resolve();
        }, this.timeout);
      });
    });
  }
}
