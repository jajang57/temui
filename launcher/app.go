package main

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"syscall"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// OpenBrowser opens the browser to the local URL
func (a *App) OpenBrowser() {
	wailsRuntime.BrowserOpenURL(a.ctx, "http://localhost:8080")
}

// App struct
type App struct {
	ctx       context.Context
	cmd       *exec.Cmd
	cmdMutex  sync.Mutex
	isRunning bool
}

func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// StartBackend starts the backend process
func (a *App) StartBackend() string {
	a.cmdMutex.Lock()
	defer a.cmdMutex.Unlock()

	if a.isRunning {
		return "Backend is already running"
	}

	// Detect correct binary name
	var exeName string
	if runtime.GOOS == "windows" {
		exeName = ".\\backend.exe"
	} else if runtime.GOOS == "darwin" {
		// On Mac, detect architecture
		if runtime.GOARCH == "arm64" {
			exeName = "./temui-mac-m1"
		} else {
			exeName = "./temui-mac-intel"
		}
	} else {
		return "Unsupported Operating System"
	}

	// Prepare command
	cmd := exec.Command(exeName)
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	}

	// Capture stdout/stderr
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	err := cmd.Start()
	if err != nil {
		return fmt.Sprintf("Failed to start backend (%s): %s", exeName, err.Error())
	}

	a.cmd = cmd
	a.isRunning = true

	// Stream logs in background
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			wailsRuntime.EventsEmit(a.ctx, "log", scanner.Text())
		}
	}()

	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			wailsRuntime.EventsEmit(a.ctx, "log", "ERROR: "+scanner.Text())
		}
	}()

	// Monitor exit
	go func() {
		cmd.Wait()
		a.cmdMutex.Lock()
		a.isRunning = false
		a.cmd = nil
		a.cmdMutex.Unlock()
		wailsRuntime.EventsEmit(a.ctx, "status", "stopped")
		wailsRuntime.EventsEmit(a.ctx, "log", "Backend Process Exited.")
	}()

	wailsRuntime.EventsEmit(a.ctx, "status", "running")
	return "Backend started successfully"
}

// StopBackend stops the backend process
func (a *App) StopBackend() string {
	a.cmdMutex.Lock()
	defer a.cmdMutex.Unlock()

	// 1. Try to kill via held reference (cleanest)
	if a.isRunning && a.cmd != nil {
		_ = a.cmd.Process.Kill()
	}

	// 2. Aggressive kill by name to catch "ghost" processes from previous sessions
	// This ensures port 8080 is actually freed.
	if runtime.GOOS == "windows" {
		_ = exec.Command("taskkill", "/F", "/IM", "backend.exe", "/T").Run()
	} else if runtime.GOOS == "darwin" {
		_ = exec.Command("pkill", "-9", "-f", "temui-mac").Run()
	}

	a.isRunning = false
	a.cmd = nil

	return "Shutdown signal sent to all backend instances"
}

// GetStatus returns current status
func (a *App) GetStatus() string {
	a.cmdMutex.Lock()
	defer a.cmdMutex.Unlock()

	// If we know it's running internally, return that
	if a.isRunning {
		return "running"
	}

	// Try to get port from .env
	port := "8080"
	file, err := os.Open(".env")
	if err == nil {
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "PORT=") {
				port = strings.TrimPrefix(line, "PORT=")
				break
			}
		}
		file.Close()
	}

	// Otherwise, check if the detected port is busy
	ln, err := net.Listen("tcp", ":"+port)
	if err != nil {
		// Port is busy, likely backend is running
		return "running"
	}
	ln.Close()

	return "stopped"
}

// GetEnv reads .env file and returns a map of settings
func (a *App) GetEnv() map[string]string {
	config := make(map[string]string)
	file, err := os.Open(".env")
	if err != nil {
		return config
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			config[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}
	return config
}

// SaveEnv saves the provided config map back to .env non-destructively
func (a *App) SaveEnv(config map[string]string) string {
	// 1. Read existing file to preserve other keys
	existing := make(map[string]string)
	content, err := os.ReadFile(".env")
	if err == nil {
		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				existing[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
			}
		}
	}

	// 2. Merge new config into existing
	for k, v := range config {
		existing[k] = v
	}

	// 3. Write back
	var output []string
	for k, v := range existing {
		output = append(output, fmt.Sprintf("%s=%s", k, v))
	}

	err = os.WriteFile(".env", []byte(strings.Join(output, "\n")), 0644)
	if err != nil {
		return "Failed to save .env: " + err.Error()
	}

	wailsRuntime.EventsEmit(a.ctx, "log", "Settings updated in .env")
	return "Settings saved successfully"
}
