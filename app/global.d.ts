import fs from "fs";
import path from "path";
import { Store } from "pinia";

import { APIShape, MainAPIShape } from "./api/api";
import { NetworkTool } from "./base/network";
import { PreferenceService } from "./common/services/preference-service";
import { AppInteractor } from "./interactors/app-interactor";
import { EntityInteractor } from "./interactors/entity-interactor";
import { FeedInteractor } from "./interactors/feed-interactor";
import { PluginSideInteractor } from "./interactors/plugin-side-interactor";
import { PreviewInteractor } from "./interactors/preview-interactor";
import { RenderInteractor } from "./interactors/render-interactor";
import { WordAddinInteractor } from "./interactors/word-addin-interactor";
import { MainRPCService } from "./main/services/main-rpc-service";
import { WindowControlService } from "./main/services/window-control-service";
import { WindowProcessManagementService } from "./main/services/window-management-service";
import { WindowStorage } from "./main/window-storage";
import { Preference } from "./preference/preference";
import { APPService } from "./renderer/services/app-service";
import { BufferService } from "./renderer/services/buffer-service";
import { CacheService } from "./renderer/services/cache-service";
import { CategorizerService } from "./renderer/services/categorizer-service";
import { DatabaseService } from "./renderer/services/database-service";
import { FeedService } from "./renderer/services/feed-service";
import { FileService } from "./renderer/services/file-service";
import { LogService } from "./renderer/services/log-service";
import { PaperService } from "./renderer/services/paper-service";
import { ReferenceService } from "./renderer/services/reference-service";
import { RenderService } from "./renderer/services/render-service";
import { SchedulerService } from "./renderer/services/scheduler-service";
import { SmartFilterService } from "./renderer/services/smartfilter-service";
import { StateService } from "./renderer/services/state-service/state-service";
import { IProcessingState } from "./renderer/services/state-service/state/processing";
import { MainRendererStateStore } from "./state/renderer/appstate";

declare global {
  var browserWindows: WindowStorage;

  interface Window {
    appInteractor: AppInteractor;
    previewInteractor: PreviewInteractor;
    pluginSideInteractor: PluginSideInteractor;

    preference: Preference;
    stateStore: MainRendererStateStore;
  }

  interface Realm {
    safeWrite: <T>(callback: () => T) => T;
    paperEntityListened: boolean;
    tagsListened: boolean;
    foldersListened: boolean;
    smartfilterListened: boolean;
    feedEntityListened: boolean;
    feedListened: boolean;
  }

  var PLAPI: APIShape;

  var PLMainAPI: MainAPIShape;
  var windowProcessManagementService: WindowProcessManagementService;
  var windowControlService: WindowControlService;

  var appService: APPService;
  var preferenceService: PreferenceService;
  var stateService: StateService;
  var logService: LogService;
  var databaseService: DatabaseService;
  var paperService: PaperService;
  var bufferService: BufferService;
  var cacheService: CacheService;
  var categorizerService: CategorizerService;
  var fileService: FileService;
  var smartFilterService: SmartFilterService;
  var feedService: FeedService;
  var renderService: RenderService;
  var referenceService: ReferenceService;
  var schedulerService: SchedulerService;
  var networkTool: NetworkTool;
  var mainRPCService: MainRPCService;

  var processingState: Store<"processingState", IProcessingState>;
}
