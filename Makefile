.PHONY: build clean

# 打包应用（vite 构建 + electron-builder，输出到 build/）
build:
	pnpm run build:electron-fast

# 清理构建产物
clean:
	pnpm exec del-cli dist dist-electron build
