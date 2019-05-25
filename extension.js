// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const showErrorMessage = message =>
  vscode.window.showErrorMessage(`CR Helper: ${message}`);

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.crHelper",
    async () => {
      const gitExtension = vscode.extensions.getExtension("vscode.git");

      if (!gitExtension || !gitExtension.isActive) {
        showErrorMessage("Git extension must be enabled!");
        return;
      }

      const git = gitExtension.exports.getAPI(1);

      if (!git.repositories.length) {
        showErrorMessage("No repositories found!");
        return;
      }

      // TODO: Add multiple repos use case
      //   if (git.repositories.length >= 1) {
      //     const options = git.repositories.map(r => r._repository.root);
      //     vscode.window.showQuickPick(options);
      //   }
      const repo = git.repositories[0];
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.SourceControl,
          title: "Refetching..."
        },
        () => repo._repository.fetchPrune()
      );
      const { refs } = repo.state;

      const parentBranch = await vscode.window.showQuickPick(
        refs.map(ref => ref.name),
        { ignoreFocusOut: true, placeHolder: "Choose the first branch..." }
      );

      const childBranch = await vscode.window.showQuickPick(
        refs.map(ref => ref.name),
        { ignoreFocusOut: true, placeHolder: "Choose the second branch..." }
      );

      if (!parentBranch || !childBranch) return;

      const result = await repo.getMergeBase(parentBranch, childBranch);

      vscode.env.clipboard.writeText(result);
      vscode.window.setStatusBarMessage(
        `CR Helper: Ref copied to clipboard!`,
        3000
      );
    }
  );

  context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
