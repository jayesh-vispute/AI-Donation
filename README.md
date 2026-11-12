# AI-Driven Smart Donation Management System

An AI-powered resource allocation and community support platform that connects donors with NGOs intelligently.

## 🚀 Features Completed to Date

1. **AI Object Detection Integration**
   - Successfully integrated a custom-trained YOLOv8 model (`best.pt`) into the FastAPI backend.
   - Built endpoints to process images, detect donation items, and return bounding boxes, confidences, and quantities.

2. **Robust Database Architecture**
   - Designed a production-ready PostgreSQL database schema using SQLAlchemy.
   - Structured 6 core tables: `users`, `ngo_profiles`, `donations`, `donation_items`, `demands`, and `matches`.
   - Enforced strict data constraints (e.g., latitude/longitude bounds, positive quantities, fulfillment limits).

3. **Intelligent Matching Engine**
   - Developed an automated algorithm (`matcher.py`) that instantly evaluates incoming donations against active NGO demands.
   - Calculates comprehensive match scores based on:
     - Item similarity
     - Fulfillment ratios (Quantities)
     - NGO Demand Priority (Urgent/High/Medium/Low)
     - Proximity scores
   - Auto-generates readable `match_reason` explanations for the frontend.

4. **Frontend & Authentication**
   - Scaffolded the React application architecture (Vite-based).
   - Integrated Firebase Authentication with a central `AuthContext` to manage donor and NGO login states seamlessly.

5. **Complete Dockerization**
   - Containerized the entire multi-tier application stack.
   - Configured `docker-compose.yml` to spin up the React frontend, FastAPI backend, and a persistent PostgreSQL database simultaneously.
   - Fixed Debian library dependencies (e.g., `libgl1`) to ensure OpenCV and YOLO function perfectly inside the Docker container.

## 🛠️ Tech Stack
- **Frontend**: React.js, Vite, Firebase Auth
- **Backend**: Python, FastAPI, SQLAlchemy
- **AI/ML**: YOLOv8, OpenCV
- **Database**: PostgreSQL
- **DevOps**: Docker, Docker Compose
