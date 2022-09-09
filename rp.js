var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/index.ts
import {
  startGroup,
  endGroup,
  error
} from "@actions/core";

// src/stacktrace/parse.ts
var stackFnCallRE = /at (.*) \((.+):(\d+):(\d+)\)$/;
var stackBarePathRE = /at ?(.*) (.+):(\d+):(\d+)$/;
var stackIgnorePatterns = [
  "node:internal",
  "/vitest/dist/",
  "/node_modules/chai/",
  "/node_modules/tinypool/",
  "/node_modules/tinyspy/"
];
var slash = (str) => str.replace(/\\/g, "/");
var parseStacktrace = (stackStr) => {
  const stackFrames = stackStr.split("\n").flatMap((raw) => {
    const line = raw.trim();
    const match = line.match(stackFnCallRE) || line.match(stackBarePathRE);
    if (!match)
      return [];
    let file = slash(match[2]);
    if (file.startsWith("file://")) {
      file = file.slice(7);
    }
    if (stackIgnorePatterns.some((p) => file.includes(p)))
      return [];
    return [
      {
        method: match[1],
        file: match[2],
        line: 1,
        column: 1
      }
    ];
  });
  return stackFrames;
};

// src/stacktrace/stringify.ts
var _a;
var repository = ((_a = process.env.GITHUB_REPOSITORY) == null ? void 0 : _a.split("/")[1]) ?? "";
var repositoryPrefixes = [
  `D:/a/${repository}/`,
  `/home/runner/work/${repository}/`
];
var stringifyStacktrace = (stack, trimRepositoryPrefix) => {
  return stack.map((s) => {
    let file = s.file;
    if (trimRepositoryPrefix) {
      file = trimPrefixes(file, repositoryPrefixes);
    }
    return `  at ${s.method ? `${s.method} ` : ""}${file}:${s.line}:${s.column}`;
  }).join("\n");
};
var trimPrefixes = (str, prefixes) => {
  for (const p of prefixes) {
    if (str.startsWith(p)) {
      str = str.slice(p.length);
      break;
    }
  }
  return str;
};

// src/index.ts
var GitHubActionsReporter = class {
  constructor({
    trimRepositoryPrefix = true,
    hideStackTrace = false
  } = {}) {
    this.options = {
      trimRepositoryPrefix,
      hideStackTrace
    };
  }
  onInit(ctx) {
    this.ctx = ctx;
  }
  async onFinished(files) {
    if (!files)
      return;
    startGroup("Vitest Annotations");
    this.reportFiles(files);
    endGroup();
  }
  reportFiles(files) {
    var _a2;
    for (const file of files) {
      if ((_a2 = file.result) == null ? void 0 : _a2.error) {
        this.reportSuiteError(file.filepath, file);
      }
      this.reportTasks(file.filepath, file.tasks);
    }
  }
  reportTasks(filename, tasks) {
    var _a2;
    for (const task of tasks) {
      if (task.type === "suite") {
        if ((_a2 = task.result) == null ? void 0 : _a2.error) {
          this.reportSuiteError(filename, task);
        }
        this.reportTasks(filename, task.tasks);
      } else {
        this.reportTest(filename, task);
      }
    }
  }
  reportSuiteError(filename, suite) {
    var _a2, _b, _c;
    const stackTrace = this.parseStacktrace((_b = (_a2 = suite.result) == null ? void 0 : _a2.error) == null ? void 0 : _b.stackStr);
    const position = this.getPositionFromError(filename, stackTrace);
    const message = this.createMessage(stackTrace);
    error(message, __spreadProps(__spreadValues({}, position), {
      title: this.getErrorTitle((_c = suite.result) == null ? void 0 : _c.error, "Failed Suite")
    }));
  }
  reportTest(filename, test) {
    var _a2, _b, _c, _d;
    if (((_a2 = test.result) == null ? void 0 : _a2.state) !== "fail")
      return;
    const stackTrace = this.parseStacktrace((_c = (_b = test.result) == null ? void 0 : _b.error) == null ? void 0 : _c.stackStr);
    const position = this.getPositionFromError(filename, stackTrace);
    const message = this.createMessage(stackTrace);
    error(message, __spreadProps(__spreadValues({}, position), {
      title: this.getErrorTitle((_d = test.result) == null ? void 0 : _d.error, "Failed Test")
    }));
  }
  parseStacktrace(stacktraceStr) {
    if (!stacktraceStr)
      return void 0;
    return parseStacktrace(stacktraceStr);
  }
  createMessage(stacktrace) {
    if (this.options.hideStackTrace)
      return ".";
    if (!stacktrace)
      return "No stacktrace";
    return stringifyStacktrace(stacktrace, this.options.trimRepositoryPrefix);
  }
  getPositionFromError(filename, stacktrace) {
    if (!stacktrace || !stacktrace[0]) {
      return { file: filename };
    }
    const { file, line, column } = stacktrace[0];
    return {
      file,
      startLine: line,
      startColumn: column
    };
  }
  getErrorTitle(error2, fallback) {
    return `${(error2 == null ? void 0 : error2.name) ?? "Error"}: ${(error2 == null ? void 0 : error2.message) ?? fallback}`;
  }
};
export {
  GitHubActionsReporter as default
};
/*!
  https://github.com/vitest-dev/vitest/blob/c4d1151fb3e8110eafd12bdadabf9eb69e3978ef/packages/vitest/src/utils/source-map.ts#L48-L79
  MIT License
  Copyright (c) 2021-Present Anthony Fu <https://github.com/antfu>
  Copyright (c) 2021-Present Matias Capeletto <https://github.com/patak-dev>
  https://github.com/vitest-dev/vitest/blob/main/LICENSE
*/
//# sourceMappingURL=index.js.map