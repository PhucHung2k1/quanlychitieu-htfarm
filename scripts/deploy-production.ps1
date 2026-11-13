param(
    [switch]$SkipPull,
    [switch]$SkipLocalBuild,
    [string]$VpsHost = $(if ($env:CHITIEU_VPS_HOST) { $env:CHITIEU_VPS_HOST } else { "root@103.72.57.184" }),
    [string]$SshKey = $(if ($env:CHITIEU_SSH_KEY) { $env:CHITIEU_SSH_KEY } else { Join-Path $env:USERPROFILE ".ssh\htfarm_codex_ed25519" })
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$TempArchive = Join-Path $env:TEMP ("htfarm-chitieu-deploy-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".tar.gz")

function Write-Step([string]$Msg) {
    Write-Host "`n==> $Msg" -ForegroundColor Cyan
}

function Assert-Command([string]$Cmd) {
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        throw "Khong tim thay lenh '$Cmd' trong PATH."
    }
}

try {
    Set-Location $ProjectRoot

    Write-Step "Kiem tra cong cu & SSH key"
    Assert-Command "git"
    Assert-Command "ssh"
    Assert-Command "scp"
    Assert-Command "python"

    if (-not (Test-Path $SshKey)) {
        throw "Khong tim thay SSH key tai: $SshKey"
    }

    $SshOpts = @("-i", $SshKey, "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new")

    if (-not $SkipPull) {
        Write-Step "Pull code moi nhat tu origin/main"
        $Branch = (git rev-parse --abbrev-ref HEAD).Trim()
        if ($Branch -ne "main") {
            throw "Dang o nhanh '$Branch' (yeu cau o nhanh 'main'). Hay chuyen ve main hoac chay voi -SkipPull."
        }

        $DirtyTracked = git status --porcelain -uno
        if ($DirtyTracked) {
            Write-Host $DirtyTracked -ForegroundColor Yellow
            throw "Co thay doi local chua commit. Vui long commit/stash truoc khi pull & deploy (hoac dung -SkipPull)."
        }

        git fetch origin main
        if ($LASTEXITCODE -ne 0) { throw "git fetch origin main that bai." }

        git pull --ff-only origin main
        if ($LASTEXITCODE -ne 0) { throw "git pull --ff-only origin main that bai." }
    } else {
        Write-Step "Bo qua git pull (-SkipPull)"
    }

    $CommitInfo = (git log -1 --oneline).Trim()
    Write-Host "Commit se deploy: $CommitInfo" -ForegroundColor Green

    if (-not $SkipLocalBuild) {
        Write-Step "Kiem tra build Frontend local truoc khi deploy (npm run build)"
        Set-Location (Join-Path $ProjectRoot "frontend")
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Set-Location $ProjectRoot
            throw "Build Frontend local that bai. Huy deploy."
        }
        Set-Location $ProjectRoot
    } else {
        Write-Step "Bo qua kiem tra build local (-SkipLocalBuild)"
    }

    Write-Step "Dong goi source code cho production (loai bo node_modules, .git, .env)"
    $env:CHITIEU_SRC = $ProjectRoot
    $env:CHITIEU_OUT = $TempArchive

    $PyScript = @'
import os, tarfile

src = os.environ['CHITIEU_SRC']
out = os.environ['CHITIEU_OUT']

exclude_dirs = {'node_modules', '.git', 'dist', '.vscode', '__pycache__', 'backups'}
exclude_exts = {'.xlsx', '.db', '.sqlite', '.log', '.zip', '.gz'}

def filter_tar(tarinfo):
    base = os.path.basename(tarinfo.name)
    if base in exclude_dirs:
        return None
    if base.startswith('.env'):
        return None
    _, ext = os.path.splitext(base)
    if ext.lower() in exclude_exts:
        return None
    return tarinfo

items = ['backend', 'frontend', 'nginx', 'docker-compose.prod.yml', 'docker-compose.yml', 'deploy.sh', 'README.md']
with tarfile.open(out, 'w:gz') as tar:
    for item in items:
        p = os.path.join(src, item)
        if os.path.exists(p):
            tar.add(p, arcname=item, filter=filter_tar)
'@

    python -c $PyScript
    Remove-Item Env:CHITIEU_SRC -ErrorAction SilentlyContinue
    Remove-Item Env:CHITIEU_OUT -ErrorAction SilentlyContinue

    if (-not (Test-Path $TempArchive)) {
        throw "Khong tao duoc archive $TempArchive."
    }

    $ArchiveSizeMB = [Math]::Round((Get-Item $TempArchive).Length / 1MB, 2)
    Write-Host "Da dong goi: $TempArchive ($ArchiveSizeMB MB)"

    Write-Step "Upload package len VPS ($VpsHost)"
    $RemoteArchive = "/tmp/htfarm-chitieu-deploy.tar.gz"
    & scp @SshOpts $TempArchive "${VpsHost}:${RemoteArchive}"
    if ($LASTEXITCODE -ne 0) { throw "SCP that bai." }

    Write-Step "Backup PostgreSQL DB, cap nhat code & build/restart Docker tren VPS"
    $RemoteScript = @"
set -euo pipefail
APP_DIR="/projects/htfarm-quanlychitieu"
BACKUP_DIR="`$APP_DIR/backups"
ARCHIVE="$RemoteArchive"

mkdir -p "`$APP_DIR" "`$BACKUP_DIR"

# 1. Backup PostgreSQL database truoc khi cap nhat (giu toi da 10 ban gan nhat)
if docker ps --format '{{.Names}}' | grep -q '^htfarm-chitieu-postgres`$'; then
  TS=`$(date +%Y%m%d-%H%M%S)
  echo "Backing up PostgreSQL database to `$BACKUP_DIR/chitieu-`$TS.sql.gz..."
  docker exec htfarm-chitieu-postgres pg_dump -U postgres quanlychitieu | gzip > "`$BACKUP_DIR/chitieu-`$TS.sql.gz" || true
  ls -1t "`$BACKUP_DIR"/chitieu-*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
fi

# 2. Bao ve file .env.production hien tai truoc khi giai nen
if [ -f "`$APP_DIR/.env.production" ]; then
  cp "`$APP_DIR/.env.production" /tmp/.env.production.chitieu.bak
fi

# 3. Giai nen source code moi de len APP_DIR
tar -xzf "`$ARCHIVE" -C "`$APP_DIR"
rm -f "`$ARCHIVE"

# Khoi phuc lai .env.production neu can
if [ -f /tmp/.env.production.chitieu.bak ]; then
  cp /tmp/.env.production.chitieu.bak "`$APP_DIR/.env.production"
  rm -f /tmp/.env.production.chitieu.bak
fi

# 4. Rebuild & khoi dong lai container bang docker compose
cd "`$APP_DIR`"
docker compose -f docker-compose.prod.yml up -d --build

# 5. Dong bo Prisma DB Schema (neu co thay doi)
sleep 4
if docker ps --format '{{.Names}}' | grep -q '^htfarm-chitieu-backend`$'; then
  echo "Synchronizing Prisma database schema..."
  docker exec htfarm-chitieu-backend npx prisma db push --skip-generate || true
fi

# 6. Tu dong don dep Docker builder cache va dangling images de giu dia sach
echo "Cleaning build cache..."
docker image prune -f
docker builder prune -af

# 7. Kiem tra trang thai container & dung luong dia
docker ps --filter "name=htfarm-chitieu" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
df -h /
"@

    $RemoteScriptUnix = $RemoteScript -replace "`r`n", "`n"
    $RemoteScriptB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($RemoteScriptUnix))
    & ssh @SshOpts $VpsHost "echo '$RemoteScriptB64' | base64 -d | bash"
    if ($LASTEXITCODE -ne 0) { throw "Thuc thi script deploy tren VPS that bai." }

    Write-Step "Kiem tra HTTPS tu ben ngoai (https://chitieu.htfarm.vn)"
    $WebResp = Invoke-WebRequest -Uri "https://chitieu.htfarm.vn" -UseBasicParsing -TimeoutSec 15
    if ($WebResp.StatusCode -ne 200) {
        throw "Frontend tra ve HTTP $($WebResp.StatusCode)"
    }

    try {
        $ApiResp = Invoke-WebRequest -Uri "https://chitieu.htfarm.vn/meta/categories" -UseBasicParsing -TimeoutSec 15
        $ApiStatus = $ApiResp.StatusCode
    } catch {
        if ($_.Exception.Response) {
            $ApiStatus = [int]$_.Exception.Response.StatusCode
        } else {
            $ApiStatus = "Error: $($_.Exception.Message)"
        }
    }

    $Stopwatch.Stop()
    Write-Host "`nDeploy hoan tat trong $([Math]::Round($Stopwatch.Elapsed.TotalSeconds, 1))s!" -ForegroundColor Green
    Write-Host "Commit : $CommitInfo" -ForegroundColor Green
    Write-Host "Web    : https://chitieu.htfarm.vn (HTTP $($WebResp.StatusCode))" -ForegroundColor Green
    Write-Host "API    : https://chitieu.htfarm.vn/meta/categories (HTTP $ApiStatus)" -ForegroundColor Green
} finally {
    Set-Location $ProjectRoot
    if (Test-Path $TempArchive) {
        Remove-Item -Force $TempArchive -ErrorAction SilentlyContinue
    }
}
