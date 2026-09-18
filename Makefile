PNPM ?= pnpm
NODE ?= node
REMOVE := $(NODE) -e "const { rmSync } = require('node:fs'); for (const path of process.argv.slice(1)) rmSync(path, { recursive: true, force: true });"

INTERMEDIATE_OUTPUTS := dist dist-electron
BUILD_OUTPUTS := $(INTERMEDIATE_OUTPUTS) build
CACHE_OUTPUTS := node_modules/.vite node_modules/.cache
LOG_OUTPUTS := logs

.DEFAULT_GOAL := build
.PHONY: build clean distclean

# 类型检查、构建并打包应用，输出到 build/
build:
	$(PNPM) run build:electron
	@$(REMOVE) $(INTERMEDIATE_OUTPUTS)
	@$(NODE) -e "const { existsSync, readdirSync, rmSync } = require('node:fs'); const root = 'build'; if (existsSync(root)) for (const entry of readdirSync(root, { withFileTypes: true })) if (entry.isDirectory() || entry.name.startsWith('builder-') || /\.(?:blockmap|ya?ml)$$/.test(entry.name)) rmSync(root + '/' + entry.name, { recursive: true, force: true });"
	@$(NODE) -e "console.log('Build complete: release artifacts are in build/.')"

# 清理构建产物、工具缓存、日志和临时文件，保留已安装依赖
clean:
	@$(REMOVE) $(BUILD_OUTPUTS) $(CACHE_OUTPUTS) $(LOG_OUTPUTS)
	@$(NODE) -e "const { readdirSync, rmSync } = require('node:fs'); for (const entry of readdirSync('.', { withFileTypes: true })) if (entry.isFile() && (/\.(?:log|tmp|temp|tsbuildinfo)$$/.test(entry.name) || entry.name.startsWith('pnpm-debug.log'))) rmSync(entry.name, { force: true });"
	@$(NODE) -e "console.log('Clean complete.')"

# 恢复到仅保留源码和锁文件的状态
distclean: clean
	@$(REMOVE) node_modules .pnpm-store
	@$(NODE) -e "console.log('Dependencies removed.')"
