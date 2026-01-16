# Antimicrobial Use Monitoring System

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Styles-Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" />
  <img src="https://img.shields.io/badge/Backend-Django-092E20?style=for-the-badge&logo=django&logoColor=FFFFFF" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-1D3557?style=for-the-badge&logo=postgresql&logoColor=FFFFFF" />
  <img src="https://img.shields.io/badge/Orchestration-Kubernetes-1E3A8A?style=for-the-badge&logo=kubernetes&logoColor=FFFFFF" />
</p>


AMU Monitoring System is a web-based application for recording, monitoring, and analysing antimicrobial use (AMU) at the farm level, with a focus on withdrawal-period compliance and residue-risk reduction.

## Overview

The system helps farmers, veterinarians, and auditors:
- Log every antimicrobial treatment in a structured way.
- Track withdrawal periods for meat and milk.
- Visualise AMU patterns over time and by antimicrobial class.
- Detect potential non-compliance before animal products enter the food chain.

## Core Features

- **Centralized AMU Logbook**  
  Record animal, species, drug, dose, route, indication, and treatment dates.

- **Withdrawal Period Tracking**  
  Store product-specific withdrawal times and automatically compute safe slaughter/milk dates.

- **Compliance & Alerts**  
  Flag animals still under withdrawal or with suspicious dosing patterns, with colour-coded statuses.

- **Analytics Dashboard**  
  Charts and tables showing AMU by species, antimicrobial family, route, and time window.

- **Reports & Export**  
  Generate summary reports (e.g., by month or herd) and export data for regulators or research.

## Tech Stack

- **Frontend:** React + Tailwind CSS  
- **Backend:** Python/Django (RESTful API)  
- **Database:** PostgreSQL for treatments, animals, products, and withdrawal periods  
- **Infrastructure:** Docker/Kubernetes for deployment and scaling  
- **Auth & Roles:** Basic role separation for farmers, vets, and admins/auditors

## Data Model (High Level)

Key entities:
- **Animal** – ID, species, age group, production type.
- **Antimicrobial Product** – molecule, strength, route, species code, recommended dose, withdrawal periods.
- **Treatment Event** – animal, product, dose, route, dates, prescriber.
- **User** – role and farm association.

## Typical Workflow

1. **Configure farm and products** (animals, antimicrobial products, and their withdrawal periods).  
2. **Record treatments** at the time of administration.  
3. **System calculates** withdrawal end dates and highlights constraints on slaughter/milking.  
4. **Users monitor dashboards** for alerts and trends.  
5. **Export reports** for audits or regulatory submissions.

## Project Goals

- Support responsible antimicrobial stewardship at farm level.  
- Reduce risk of violative residues entering the food chain.  
- Provide a practical, usable tool that aligns with international AMU monitoring guidance.
