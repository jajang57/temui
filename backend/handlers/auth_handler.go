package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"project-akuntansi-backend/database"
	"project-akuntansi-backend/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("your-secret-key-here") // Fallback
	}
}

// ... (skip types) ...

// (Inside AuthMiddleware)
// Validasi apakah token yang digunakan masih sama dengan yang tersimpan (single device)
// DISABLE FOR PROXY MODE: Karena DB Consultant & Client beda, token aktif tidak akan sinkron.
// if strings.TrimSpace(user.ActiveToken) != strings.TrimSpace(tokenString) {
// 	fmt.Printf("[DEBUG AUTH] Token mismatch. DB token: %s, Request token: %s\n", user.ActiveToken, tokenString)
// 	c.JSON(http.StatusUnauthorized, gin.H{
// 		"error": "Session telah berakhir. Akun Anda sedang digunakan di device lain.",
// 		"code":  "SINGLE_DEVICE_VIOLATION",
// 	})
// 	c.Abort()
// 	return
// }

type Claims struct {
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	SessionID string `json:"session_id"`          // Tambah session ID untuk validasi device
	ClientID  string `json:"client_id,omitempty"` // NEW: Bind token to specific client
	jwt.RegisteredClaims
}

// LoginRequest - Structure untuk request login
type LoginRequest struct {
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password" binding:"required"`
	ClientID   string `json:"client_id"` // NEW: Optional client selection
	DeviceInfo string `json:"deviceInfo"`
}

// RegisterRequest - Structure untuk request register
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	FullName string `json:"fullName" binding:"required"`
}

// LoginResponse - Structure untuk response login
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// POST /api/register
func Register(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validasi panjang username dan password
		if len(req.Username) < 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username minimal 3 karakter"})
			return
		}

		if len(req.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password minimal 6 karakter"})
			return
		}

		// Cek apakah username sudah ada
		var existingUser models.User
		if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username sudah terdaftar"})
			return
		}

		// Buat user baru
		user := models.User{
			Username: req.Username,
			Password: req.Password,
			FullName: req.FullName,
		}

		// Hash password
		if err := user.HashPassword(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password"})
			return
		}

		// Simpan ke database
		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Registrasi berhasil"})
	}
}

// POST /api/login
func Login(masterDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var targetDB *gorm.DB
		targetDB = masterDB // Default to Master DB (Local Login)

		// Jika ClientID dipilih, switch ke DB Client
		if req.ClientID != "" {
			var clientReg models.ClientRegistry
			if err := masterDB.Where("id = ?", req.ClientID).First(&clientReg).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Client ID"})
				return
			}

			// Connect ke Client DB
			clientConn, err := database.GetClientDB(req.ClientID, clientReg.DBConfig)
			if err != nil {
				c.JSON(http.StatusBadGateway, gin.H{"error": "Gagal terhubung ke Database Client: " + err.Error()})
				return
			}
			targetDB = clientConn
		}

		// Cari user di Target DB
		var user models.User
		if err := targetDB.Where("username = ?", req.Username).First(&user).Error; err != nil {
			// Jika user tidak ditemukan di Client DB, sarankan register
			if req.ClientID != "" {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":      "User tidak ditemukan di Database Klien ini.",
					"code":       "USER_NOT_FOUND_CLIENT",
					"suggestion": "Silakan buat akun Konsultan baru di klien ini.",
				})
				return
			}
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau password salah"})
			return
		}

		// Cek password
		if !user.CheckPassword(req.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau password salah"})
			return
		}

		// Validasi Role Consultant (Jika login ke Client DB)
		if req.ClientID != "" && user.Role != "consultant" && user.Role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akun ini bukan akun Konsultan."})
			return
		}

		// Generate session ID
		sessionID, err := generateSessionID()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat session"})
			return
		}

		// Generate JWT token dengan extension ClientID
		token, err := generateToken(user.ID, user.Username, sessionID, req.ClientID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
			return
		}

		// Update user info
		deviceInfo := req.DeviceInfo
		if deviceInfo == "" {
			deviceInfo = c.GetHeader("User-Agent")
		}
		now := time.Now()
		targetDB.Model(&user).Updates(map[string]interface{}{
			"active_token":  token,
			"device_info":   deviceInfo,
			"last_login_at": &now,
		})

		response := LoginResponse{
			Token: token,
			User:  user,
		}

		c.JSON(http.StatusOK, response)
	}
}

// POST /api/logout
func Logout(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by AuthMiddleware)
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terautentikasi"})
			return
		}

		// Clear active token untuk logout
		if err := db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"active_token": "",
			"device_info":  "",
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal melakukan logout"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Logout berhasil"})
	}
}

// generateSessionID - Generate unique session ID
func generateSessionID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// generateToken - Generate JWT token with session ID and ClientID
func generateToken(userID uint, username string, sessionID string, clientID string) (string, error) {
	claims := Claims{
		UserID:    userID,
		Username:  username,
		SessionID: sessionID,
		ClientID:  clientID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token berlaku 24 jam
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// AuthMiddleware - Middleware untuk melindungi route yang butuh authentication
// Accepts masterDB to validate token against central user registry
func AuthMiddleware(masterDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")

		// Hapus "Bearer " prefix jika ada
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak ditemukan"})
			c.Abort()
			return
		}

		// Parse token
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
			c.Abort()
			return
		}

		// Validasi claims
		if claims, ok := token.Claims.(*Claims); ok {

			// 1. Validate User against MASTER DB (Always)
			var masterUser models.User
			if err := masterDB.First(&masterUser, claims.UserID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan (Master DB)"})
				c.Abort()
				return
			}

			// 2. Determine Context Context (Client DB or Master DB)
			currentDB := c.MustGet("db").(*gorm.DB)

			// Jika currentDB != masterDB (artinya kita sedang akses Client DB via Dynamic Middleware)
			// Kita harus pastikan user ini ada di Client DB untuk referensi Audit Trail (FK)
			// NOTE: Kita gunakan pointer comparison atau check object
			// Cara aman: cek apakah clientID header ada
			clientID := c.GetHeader("X-Target-Client-ID")

			finalUserID := masterUser.ID

			if clientID != "" {
				// Kita sedang di mode akses ID
				// Sync User Konsultan ke Client DB "Shadow User"
				var clientUser models.User
				// Cari by username
				if err := currentDB.Where("username = ?", masterUser.Username).First(&clientUser).Error; err != nil {
					// Jika tidak ada, buat user baru di Client DB
					clientUser = models.User{
						Username: masterUser.Username,
						FullName: masterUser.FullName + " (Consultant)",
						Role:     "consultant",
						Password: masterUser.Password, // Copy hash is fine, or random
					}
					if err := currentDB.Create(&clientUser).Error; err != nil {
						fmt.Printf("Failed to sync consultant user to client DB: %v\n", err)
						// Non-fatal? Audit trail might fail.
					}
				}
				// GANTI userID di context menjadi ID versi Client DB
				// Agar audit trail masuk ke ID yang benar di tabel users lokal
				finalUserID = clientUser.ID
			}

			// Simpan data user ke context
			c.Set("userID", finalUserID) // ID Lokal (bisa beda dengan Master ID)
			c.Set("username", masterUser.Username)
			c.Set("sessionID", claims.SessionID)
			c.Set("user", masterUser) // Object User tetap Master User untuk referensi detail
			c.Set("isConsultant", true)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token claims tidak valid"})
			c.Abort()
			return
		}

		c.Next()
	}
}
