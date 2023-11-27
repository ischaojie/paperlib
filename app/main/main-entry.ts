import {
  IpcMainEvent,
  IpcMainInvokeEvent,
  MessageChannelMain,
  app,
  ipcMain,
} from "electron";
import Store from "electron-store";
import path from "node:path";
import { release } from "os";

import { InjectionContainer } from "@/base/injection/injection.ts";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol.ts";
import { PreferenceService } from "@/common/services/preference-service.ts";
import { IInjectable } from "@/main/services/injectable.ts";
import { WindowStorage } from "@/main/window-storage.ts";

import { CommService } from "./services/comm-service.ts";
import { ContextMenuService } from "./services/contextmenu-service.ts";
import { ExtensionProcessManagementService } from "./services/extension-process-management-service.ts";
import { FileSystemService } from "./services/filesystem-service.ts";
import { MainRPCService } from "./services/main-rpc-service.ts";
import { MenuService } from "./services/menu-service.ts";
import { ProxyService } from "./services/proxy-service.ts";
import { UpgradeService } from "./services/upgrade-service.ts";
import { WindowProcessManagementService } from "./services/window-process-management-service.ts";

Store.initRenderer();

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("paperlib", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("paperlib");
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// let win: BrowserWindow | null = null;
// let winPlugin: BrowserWindow | null = null;
// let winSidework: BrowserWindow | null = null;

// async function createWindow() {
//   win = await createMainWindow(win, preference, winPlugin, winSidework);

//   globalShortcut.register(
//     (preference.get("shortcutPlugin") as string) || "CommandOrControl+Shift+I",
//     async () => {
//       // win?.blur();
//       if (winPlugin === null || winPlugin?.isDestroyed()) {
//         winPlugin = await createPluginWindow(winPlugin);
//         winPlugin.on("ready-to-show", () => {
//           setMainPluginCommunicationChannel(win, winPlugin);

//           setWindowsSpecificStyles(winPlugin);
//         });

//         winPlugin.on("hide", () => {
//           winPlugin?.setSize(600, 76);

//           if (platform() === "darwin") {
//             win?.hide();
//             app.hide();
//           }
//         });
//       }

//       const { x, y } = screen.getCursorScreenPoint();
//       const currentDisplay = screen.getDisplayNearestPoint({ x, y });
//       const bounds = currentDisplay.bounds;
//       const centerx = bounds.x + (bounds.width - 600) / 2;
//       const centery = bounds.y + (bounds.height - 76) / 2;
//       winPlugin?.setPosition(parseInt(`${centerx}`), parseInt(`${centery}`));
//       winPlugin?.show();
//     }
//   );
// }

async function initialize() {
  // ============================================================
  // 1. Initilize the RPC service for current process
  const mainRPCService = new MainRPCService();
  // ============================================================
  // 2. Start the port exchange process.
  mainRPCService.initCommunication();

  // ============================================================
  // 3. Create the instances for all services, tools, etc. of the current process.
  const injectionContainer = new InjectionContainer();
  const instances = injectionContainer.createInstance<IInjectable>({
    preferenceService: PreferenceService,
    windowProcessManagementService: WindowProcessManagementService,
    fileSystemService: FileSystemService,
    contextMenuService: ContextMenuService,
    menuService: MenuService,
    upgradeService: UpgradeService,
    proxyService: ProxyService,
    extensionProcessService: ExtensionProcessManagementService,
  });
  // 3.1 Expose the instances to the global scope for convenience.
  for (const [key, instance] of Object.entries(instances)) {
    globalThis[key] = instance;
  }

  // ============================================================
  // 4. Set actionors for RPC service with all initialized services.
  //    Expose the APIs of the current process to other processes
  mainRPCService.setActionor({
    windowProcessManagementService,
    fileSystemService,
    contextMenuService,
    menuService,
    upgradeService,
    proxyService,
  });

  // ============================================================
  // 5. Setup other things for the main process.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("second-instance", () => {
    if (windowProcessManagementService.browserWindows.has("rendererProcess")) {
      if (
        windowProcessManagementService.browserWindows
          .get("browserWindows")
          .isMinimized()
      )
        windowProcessManagementService.browserWindows
          .get("browserWindows")
          .restore();
      windowProcessManagementService.browserWindows
        .get("browserWindows")
        .focus();
    }
  });

  app.on("activate", () => {
    if (windowProcessManagementService.browserWindows.has("rendererProcess")) {
      windowProcessManagementService.browserWindows
        .get("rendererProcess")
        .show();
      windowProcessManagementService.browserWindows
        .get("rendererProcess")
        .focus();
    } else {
      windowProcessManagementService.createMainRenderer();
    }
  });

  // TODO: check where we use this?
  ipcMain.handle("version", () => {
    return app.getVersion();
  });

  // ============================================================
  // 6. Create the main renderer process.
  windowProcessManagementService.createMainRenderer();
}

app.whenReady().then(initialize);

// registerSideworkWindowEvents(winSidework);
