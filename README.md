# Temui - Accounting Platform

Temui is a full-stack accounting platform built with `Golang`, `React`, `PostgreSQL`, and `Wails`.

The system is designed to cover end-to-end accounting operations, from master data setup and transaction entry to general ledger processing, inventory control, fixed assets, and financial reporting. It supports both web-style deployment and desktop packaging, making it suitable for internal business operations as well as distributable client software.

## Executive Summary

This project demonstrates the development of a production-style accounting application with:

- modern full-stack architecture
- modular accounting and operational features
- support for multi-client or consultant workflow
- desktop packaging for easier distribution
- business-oriented UI for daily finance operations

From a portfolio perspective, this project is a strong representation of:

- accounting software engineering
- ERP / finance system development
- Golang backend architecture
- React frontend implementation
- multi-tenant and deployment-oriented application design

## Core Business Modules

### Accounting

- Chart of Accounts (COA)
- General Ledger (GL)
- Trial Balance
- Buku Besar
- Laba Rugi
- Neraca
- Arus Kas
- Perubahan Modal
- Audit trail and transaction history
- AJE (Adjusting Journal Entry)

### Operational Modules

- Sales
- Purchasing
- Inventory / stock movement
- Warehouse management
- Tax master data
- Customer and supplier management
- Employee management
- Project master data
- Multi-currency support

### Asset Management

- Fixed asset master data
- Asset registration
- Depreciation workflow
- Posting asset transactions to GL

### System / Platform Features

- Authentication and protected routes
- Theme and user settings
- Backup and restore
- Client mode and consultant mode
- Dynamic database switching for multi-client architecture
- Desktop packaging with Wails

## Operating Modes

Temui supports two main operating modes:

### 1. Client Mode

Used for a standard accounting implementation where one installation is connected to one full accounting database.

### 2. Consultant Mode

Used for consultant or multi-client scenarios, where the system can manage multiple client databases through a central registry and dynamic DB connection switching.

This makes the application suitable not only as an internal accounting system, but also as a platform for accounting consultants handling multiple businesses.

## Tech Stack

### Backend

- `Go 1.24`
- `Gin`
- `GORM`
- `PostgreSQL`
- `JWT Authentication`
- `Excelize`

### Frontend

- `React 19`
- `Vite`
- `React Router`
- `MUI`
- `AG Grid`
- `Recharts`
- `Tailwind CSS`
- `Axios`

### Desktop / Packaging

- `Wails`

## Architecture Highlights

- `React` frontend separated from backend service logic
- `Gin` API backend with modular handlers
- `GORM` model-driven persistence layer
- `PostgreSQL` as the core relational database
- consultant mode with dynamic database connection per client
- deployable as:
  - web-style application
  - desktop executable package

## Selected Features Worth Highlighting

- Full accounting workflow from transaction input to financial statements
- Multi-tenant / multi-client accounting support
- Desktop executable delivery for easier operational distribution
- Practical business modules beyond accounting only
- Production-oriented backup, restore, and migration support

## Screenshots

### Main Application Views

<p align="center">
  <img width="900" alt="Dashboard" src="https://github.com/user-attachments/assets/d2774f16-6599-4fe9-9667-dcf2c94f7906" />
</p>

<p align="center">
  <img width="900" alt="Transaction management" src="https://github.com/user-attachments/assets/6321e1ee-24ac-43bd-8d4f-ee214f8dfe71" />
</p>

<p align="center">
  <img width="900" alt="General ledger and accounting views" src="https://github.com/user-attachments/assets/2bcee3d1-e10b-4338-ac11-86fe515f1844" />
</p>

<p align="center">
  <img width="900" alt="Report interface" src="https://github.com/user-attachments/assets/da019536-960b-4915-9afe-03539807c587" />
</p>

### Additional Screens

<details>
  <summary>Expand screenshot gallery</summary>

  <p align="center">
    <img width="900" alt="Screen 1" src="https://github.com/user-attachments/assets/01b44183-5d22-4892-ae6e-8734ef756818" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 2" src="https://github.com/user-attachments/assets/eb88678f-012d-42ca-b08f-073e280e3953" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 3" src="https://github.com/user-attachments/assets/84991bdc-732d-450b-b086-61be83ad4f8b" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 4" src="https://github.com/user-attachments/assets/ba79a652-dc6f-45f0-9a8b-1bf05c1ced0c" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 5" src="https://github.com/user-attachments/assets/12775776-7d3e-452f-931f-2b65daedef66" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 6" src="https://github.com/user-attachments/assets/3c97f759-ff8e-439e-a0fb-3b1ce6de2582" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 7" src="https://github.com/user-attachments/assets/4cf6d692-c84b-4c68-a3d8-5985f76d00bd" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 8" src="https://github.com/user-attachments/assets/f4c08341-7875-4c70-abe6-efc85a6bf8a7" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 9" src="https://github.com/user-attachments/assets/0cabc53b-3819-40a0-9ec6-f53fc26f7c61" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 10" src="https://github.com/user-attachments/assets/34a61bc3-bde3-4107-8039-3997d3fb02fe" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 11" src="https://github.com/user-attachments/assets/6736f2bb-be2a-4104-844f-9c7eead7cc04" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 12" src="https://github.com/user-attachments/assets/5c39f012-853c-470c-adc4-9ad4aff62d49" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 13" src="https://github.com/user-attachments/assets/4b97ecac-004b-4247-8457-fb6a746ade8f" />
  </p>

  <p align="center">
    <img width="900" alt="Screen 14" src="https://github.com/user-attachments/assets/297a49a3-6472-401b-a386-d15b6ee22b4a" />
  </p>
</details>

## Project Structure

```text
temui/
├── backend/          # Gin API, models, handlers, scripts, DB logic
├── frontend/         # React frontend application
├── launcher/         # Wails desktop launcher
├── release/          # Build and packaging outputs
├── temui_build/      # Deployment bundle notes
└── README.md
```

## Local Development

### Backend

```bash
cd backend
go run main.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Desktop Packaging

Temui also supports desktop delivery using Wails. The launcher and deployment bundle allow the application to be distributed as a single executable package for operational use.

For deployment notes, see:

- `temui_build/README.md`

## Deployment Notes

- uses `.env` for environment-specific settings
- supports switching between client and consultant mode
- can be packaged for desktop distribution
- supports production-oriented database operations such as backup and restore

## Suitable Portfolio Positioning

This project is suitable to present in applications for roles such as:

- Software Engineer
- Full-Stack Developer
- Golang Backend Developer
- React Frontend Developer
- ERP / Accounting System Developer
- Business Application Developer

## Notes

- This repository reflects a real business-style accounting platform, not a toy CRUD demo.
- The codebase includes both accounting logic and operational modules.
- The project is especially strong for demonstrating practical software development in finance and internal business systems.
