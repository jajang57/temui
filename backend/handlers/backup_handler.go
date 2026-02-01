package handlers

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"project-akuntansi-backend/models"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ExecuteBackup runs pg_dump command
func ExecuteBackup(host, port, user, password, dbname, outputPath, binPath string) error {
	// Ensure directory exists
	os.MkdirAll(filepath.Dir(outputPath), 0755)

	// Build command
	pgDump := "pg_dump"
	if binPath != "" {
		pgDump = filepath.Join(binPath, "pg_dump")
	} else if envPath := os.Getenv("PG_BIN_PATH"); envPath != "" {
		pgDump = filepath.Join(envPath, "pg_dump")
	}

	// pg_dump -h host -p port -U user -F c -b -v -f outputPath dbname
	cmd := exec.Command(pgDump,
		"-h", host,
		"-p", port,
		"-U", user,
		"-F", "c", // Custom format (compressed, better for restore)
		"-b", // Include large objects
		"-v", // Verbose
		"-f", outputPath,
		dbname,
	)

	// Set password via env var to avoid prompt/security leaks in args
	cmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", password))

	// Capture output
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("pg_dump failed: %v, output: %s", err, string(output))
	}

	return nil
}

// ExecuteRestore runs psql/pg_restore command
func ExecuteRestore(host, port, user, password, dbname, inputPath, binPath string) error {
	// Build command
	pgRestore := "pg_restore"
	if binPath != "" {
		pgRestore = filepath.Join(binPath, "pg_restore")
	} else if envPath := os.Getenv("PG_BIN_PATH"); envPath != "" {
		pgRestore = filepath.Join(envPath, "pg_restore")
	}

	// pg_restore -h host -p port -U user -d dbname -v inputPath
	cmd := exec.Command(pgRestore,
		"-h", host,
		"-p", port,
		"-U", user,
		"-d", dbname,
		"-c", // Clean (drop) objects before recreating
		"-v",
		inputPath,
	)

	cmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", password))

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("pg_restore failed: %v, output: %s", err, string(output))
	}

	return nil
}

// BackupInternalDatabaseDB triggers backup for the master/internal database
func BackupInternalDatabaseDB(c *gin.Context) {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "akuntan"
	}

	backupDir := "backups"
	timestamp := time.Now().Format("20060102_150405")
	backupFile := filepath.Join(backupDir, fmt.Sprintf("master_backup_%s.dump", timestamp))

	// Get PG_BIN_PATH from DB
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")
	var setting models.UserThemeSetting
	db.Where("user_id = ?", userID).First(&setting)

	if err := ExecuteBackup(host, port, user, password, dbname, backupFile, setting.PgBinPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Master database backup created successfully",
		"backup_file": backupFile,
		"filename":    filepath.Base(backupFile),
	})
}

// ListInternalBackupsDB lists backups for master database
func ListInternalBackupsDB(c *gin.Context) {
	backupDir := "backups"
	pattern := filepath.Join(backupDir, "master_backup_*.dump")

	files, err := filepath.Glob(pattern)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list backups"})
		return
	}

	backups := []gin.H{}
	for _, file := range files {
		info, err := os.Stat(file)
		if err == nil {
			backups = append(backups, gin.H{
				"filename":   filepath.Base(file),
				"path":       file,
				"size":       info.Size(),
				"created_at": info.ModTime().Format(time.RFC3339),
			})
		}
	}
	c.JSON(http.StatusOK, backups)
}

// RestoreInternalDatabaseDB triggers restore for master database
func RestoreInternalDatabaseDB(c *gin.Context) {
	var req struct {
		BackupFile string `json:"backup_file"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "akuntan"
	}

	// Get PG_BIN_PATH from DB
	db := c.MustGet("db").(*gorm.DB)
	userID := c.GetUint("user_id")
	var setting models.UserThemeSetting
	db.Where("user_id = ?", userID).First(&setting)

	if err := ExecuteRestore(host, port, user, password, dbname, req.BackupFile, setting.PgBinPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Master database restored successfully"})
}
