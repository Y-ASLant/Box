.PHONY: build clean

# 类型检查、构建并打包应用，输出到 build/
build:
	pnpm run build:electron

# 清理构建产物
clean:
	pnpm exec del-cli dist dist-electron build
