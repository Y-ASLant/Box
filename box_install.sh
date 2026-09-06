#!/bin/bash

# 脚本名称: download_and_install.sh
# 描述: 自动检测系统架构，从指定链接下载对应的程序包并安装
# 作者: Craft
# 日期: 2025-07-31

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否以root权限运行
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        print_warning "当前脚本没有以root权限运行"
        print_warning "如果安装到系统目录(如/opt)，可能需要root权限"
        print_warning "建议使用: sudo $0"
        read -p "是否继续执行? (y/n, 默认: n): " CONTINUE
        CONTINUE=${CONTINUE:-n}
        if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
            print_info "已取消安装"
            exit 0
        fi
        print_info "继续执行，但可能会遇到权限问题..."
    else
        print_info "以root权限运行"
    fi
}

# 下载链接
X64_DOWNLOAD_URL="https://aslant-api.cn/d/Link/box/x64.tar.gz"
ARM64_DOWNLOAD_URL="https://aslant-api.cn/d/Link/box/arm64.tar.gz"

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 命令缺失，请检查tar和wget后重新尝试"
        exit 1
    fi
}

# 检查必要的命令
check_command "wget"
check_command "tar"

# 检测系统架构
detect_arch() {
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        echo "x86_64"
    elif [ "$ARCH" = "aarch64" ]; then
        echo "arm64"
    else
        echo "unknown"
    fi
}

# 主函数
main() {
    # 检查权限
    check_root
    
    print_info "开始检测系统信息..."
    
    # 只检测系统架构
    ARCH=$(detect_arch)
    print_info "检测到系统架构: $ARCH"
    
    # 检查是否支持当前架构
    if [ "$ARCH" = "unknown" ]; then
        print_error "不支持的系统架构，仅支持x86_64和arm64"
        exit 1
    fi
    
    # 根据架构选择下载链接
    if [ "$ARCH" = "x86_64" ]; then
        DOWNLOAD_URL="$X64_DOWNLOAD_URL"
        DOWNLOAD_FILE="box_x64.tar.gz"
    else
        DOWNLOAD_URL="$ARM64_DOWNLOAD_URL"
        DOWNLOAD_FILE="box_arm64.tar.gz"
    fi
    
    print_info "开始下载安装包..."
    
    # 下载程序包
    if wget -q --show-progress "$DOWNLOAD_URL" -O "$DOWNLOAD_FILE"; then
        print_success "下载完成: $DOWNLOAD_FILE"
    else
        print_error "下载失败，请检查网络连接或服务器地址"
        exit 1
    fi
    
    # 提示用户输入安装位置
    read -p "请输入安装位置 (默认: /opt/aslant): " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-/opt/aslant}
    
    # 创建安装目录（如果不存在）
    if [ ! -d "$INSTALL_DIR" ]; then
        print_info "创建安装目录: $INSTALL_DIR"
        if ! mkdir -p "$INSTALL_DIR" 2>/dev/null; then
            print_error "无法创建目录，权限不足"
            print_warning "请尝试以下解决方案:"
            print_warning "1. 使用 sudo 重新运行此脚本: sudo $0"
            print_warning "2. 选择一个当前用户有权限的目录"
            print_warning "3. 手动创建目录: sudo mkdir -p $INSTALL_DIR"
            
            read -p "是否尝试使用sudo创建目录? (y/n, 默认: y): " USE_SUDO
            USE_SUDO=${USE_SUDO:-y}
            if [ "$USE_SUDO" = "y" ] || [ "$USE_SUDO" = "Y" ]; then
                print_info "尝试使用sudo创建目录..."
                if ! sudo mkdir -p "$INSTALL_DIR"; then
                    print_error "使用sudo创建目录失败，请检查权限或手动创建"
                    exit 1
                fi
                # 修改目录所有者为当前用户
                sudo chown -R $(whoami) "$INSTALL_DIR"
                print_success "目录创建成功，并已设置权限"
            else
                print_info "请选择其他安装位置或以root权限重新运行"
                exit 1
            fi
        fi
    fi
    
    # 解压文件到安装目录
    print_info "正在解压文件到 $INSTALL_DIR ..."
    if ! tar -xzf "$DOWNLOAD_FILE" -C "$INSTALL_DIR" 2>/dev/null; then
        print_error "解压失败，可能是权限问题"
        print_warning "尝试使用sudo解压..."
        if ! sudo tar -xzf "$DOWNLOAD_FILE" -C "$INSTALL_DIR"; then
            print_error "使用sudo解压也失败，请检查权限或文件完整性"
            exit 1
        fi
        # 修改解压文件所有者为当前用户
        sudo chown -R $(whoami) "$INSTALL_DIR"
    else
        print_success "解压完成"
    fi
    
    # 设置权限
    print_info "设置执行权限..."
    if ! chmod -R 755 "$INSTALL_DIR" 2>/dev/null; then
        print_warning "设置权限失败，尝试使用sudo..."
        sudo chmod -R 755 "$INSTALL_DIR"
    fi
    
    print_success "安装完成！程序已安装到: $INSTALL_DIR"
    print_info "您可以通过以下命令启动程序:"
    print_info "$INSTALL_DIR/box"
    
    # 清理下载的压缩文件
    read -p "是否删除下载的压缩文件? (y/n, 默认: y): " DELETE_ZIP
    DELETE_ZIP=${DELETE_ZIP:-y}
    if [ "$DELETE_ZIP" = "y" ] || [ "$DELETE_ZIP" = "Y" ]; then
        rm -f "$DOWNLOAD_FILE"
        print_info "已删除下载的压缩文件"
    fi
}

# 执行主函数
main