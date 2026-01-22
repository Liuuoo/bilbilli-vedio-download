FFmpeg 是一个强大的命令行工具，用于处理视频和音频（如合并、转换格式）。

由于 B站下载的视频（画面）和音频（声音）是分开的两个文件，你需要 FFmpeg 将它们合并成一个完整的 MP4 文件。

## 🟢 Windows 用户

### 方法一：命令行极速安装（推荐 Win10/11 用户）

这是最现代、最快的方法，**自动下载、自动安装、自动配环境变量**。

1. **打开终端**：
    
    - 右键点击“开始”菜单，选择 **Windows PowerShell** 或 **终端 (Terminal)**。
        
2. **输入命令**： 复制下面的命令并回车：
    
    ```
    winget install Gyan.FFmpeg
    ```
    
3. **等待完成**：
    
    - 屏幕会出现进度条，可能需要确认协议（输入 `Y` 并回车）。
        
    - 安装完成后，**重启你的终端窗口**。
        
4. **验证**： 输入 `ffmpeg -version`，如果有输出版本信息，即大功告成！
    

### 方法二：手动下载 + 命令行配置环境变量

如果你更喜欢手动下载 ZIP 包，或者 `winget` 无法使用，可以使用此方法。

#### 第一步：下载与解压

1. 访问 [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/ "null") 下载 `ffmpeg-release-essentials.zip`。
    
2. 解压后，将文件夹重命名为 `ffmpeg`，并移动到 C 盘根目录（例如 `C:\ffmpeg`）。
    
    - **确保路径正确**：你的 `ffmpeg.exe` 应该位于 `C:\ffmpeg\bin\ffmpeg.exe`。
        

#### 第二步：使用命令行配置环境变量

不需要去点那堆复杂的菜单，直接用管理员权限运行一条命令即可。

1. **以管理员身份打开 CMD**：
    
    - 按 `Win` 键，搜索 `cmd`。
        
    - **右键点击**“命令提示符”，选择 **“以管理员身份运行”**。
        
2. **执行命令**： 复制以下命令并回车（假设你的安装路径是 `C:\ffmpeg`）：
    
    ```
    setx /m PATH "%PATH%;C:\ffmpeg\bin"
    ```
    
    - **注意**：如果提示“成功: 指定的值已得到保存”，说明配置成功。
        
    - **警告**：`/m` 参数代表修改系统级变量，必须有管理员权限。
        
3. **验证**：
    
    - **关闭并重新打开** CMD 窗口。
        
    - 输入 `ffmpeg -version`。
        

### 方法三：懒人版（仅针对当前文件夹）

如果你不想配置任何东西，只想赶紧用一下：

1. 下载并解压 ZIP 包。
    
2. 找到 `bin` 文件夹里的 `ffmpeg.exe`。
    
3. 把 `ffmpeg.exe` **复制**到你存放 Python 脚本或视频文件的**同一个文件夹**里。
    
4. 直接运行脚本即可。
    

## 🍎 macOS 用户

### 方法一：使用 Homebrew（推荐）

如果你安装了 Homebrew，这是最快的方法：

1. 打开终端 (Terminal)。
    
2. 输入命令：
    
    ```
    brew install ffmpeg
    ```
    
3. 等待安装完成即可。
    

### 方法二：手动下载

1. 访问：[https://evermeet.cx/ffmpeg/](https://evermeet.cx/ffmpeg/ "null")
    
2. 点击左侧绿色的 **Download** 按钮。
    
3. 解压下载的 `.7z` 文件。
    
4. 将解压出的 `ffmpeg` 文件移动到 `/usr/local/bin/` 目录下。
    

## 🐧 Linux 用户

### Ubuntu / Debian

```
sudo apt update
sudo apt install ffmpeg
```

### CentOS / Fedora

```
sudo dnf install ffmpeg
```

## 常见问题

**Q: 我双击 `ffmpeg.exe` 为什么闪一下就没了？** A: FFmpeg 是纯命令行工具，没有图形界面。你需要通过 CMD 或 PowerShell 输入命令来使用它。

**Q: 运行 `winget` 提示找不到命令？** A: 请确保你的 Windows 版本是最新的（Win 10 1809+ 或 Win 11）。如果还是不行，请使用方法二（手动下载）。

**Q: 合并命令是什么来着？** A: 在包含 `video.m4s` 和 `audio.m4s` 的文件夹里打开命令行，输入：

```
ffmpeg -i video.m4s -i audio.m4s -c copy output.mp4
```