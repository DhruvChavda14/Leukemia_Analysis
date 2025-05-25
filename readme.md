#  XAI-Powered Leukemia Detection

##  Mission

Millions in India's rural interiors continue to lack timely cancer diagnoses because of a dearth of experienced pathologists and oncologists. Our mission is to *close this diagnosis gap* employing cutting-edge AI and Explainable AI (XAI) technologies.

We aim to *empower local clinics, health workers, and small pathology labs* with a *cloud-based leukemia detection system* that delivers *fast, accurate, and interpretable results* — reducing diagnostic time from hours to minutes and eliminating the need for expensive, inaccessible lab infrastructure.

> ⚕ *“We’re not just building a tool — we’re building a lifeline for 500 million people where doctors don’t reach, and cancer often wins by default.”*

---

##  Overview

Leukemia is a potentially life-threatening cancer of the blood that, when caught early, has more than a 90% survival rate. But *delayed diagnosis, human mistakes, and deficient diagnostic facilities* are responsible for causing high mortality rates — particularly in deprived areas.

>  In 2024, approximately *474,000 individuals worldwide* will be diagnosed with leukemia (source: WHO).
>  In India, more than *25,000 children are diagnosed every year* with leukemia (source: National Institute of Health).

We introduce a *CNN + XAI (Grad-CAM + Saliency Map) driven pathology imaging platform* that is trained on the well-known globally used *ALL-IDB dataset*, with a **97% accuracy rate**. The system not only classifies the leukemia stage (Beginner, Early, Pre-pro) but also gives **clinically interpretable visual heatmaps**, providing trust and transparency to medical professionals.

---

## ️ Interface Screenshots

### 1. Login Page  
![Login Page](./screenshots/login_page.png)  
*Secure role-based login for doctors, pathologists, and patients.*

### 2. Doctor Dashboard  
![Doctor Dashboard](./screenshots/doctor_dashboard.png)  
*View reports uploaded by Pathologist.*

![Doctor Dashboard](./screenshots/xai_analysis.png)  
AI analysis with heatmaps, and clinical notes.

### 3. Pathologist Dashboard  
![Pathologist Dashboard](./screenshots/pathologist_dashboard.png)  
*Upload blood smear images and monitor AI processing status.*

### 4. Patient Dashboard  
![Patient Dashboard](./screenshots/patient_dashboard.png)
*View diagnosis reports, leukemia stage, and download reports.*

---

##  Key Features

-  *High Accuracy Detection* — 97% accuracy using Convolutional Neural Networks.
-  *Explainability with XAI* — Visualize key image regions that affect diagnosis using Grad-CAM and Saliency Maps.
-  *Cloud-Hosted Platform* — Available even in remote rural areas with minimal internet connectivity.
- ‍⚕‍‍‍ *Interfaces for Doctors, Pathologists & Patients* — Facilitating collaborative and effective diagnostics.
-  *Cost Reduction* — Reduce diagnosis expense by as much as 70% (no commuting, less tests, quicker results).

---

##  Tech Stack

- * Model:* Convolutional Neural Network (CNN), Explainable AI (Grad-CAM, Saliency Maps)
- * Frontend:* React.js, Tailwind CSS
- * Backend:* Node.js, Express.js, JavaScript, JWT (Authentication)
- *☁ Deployment:* Netlify (Frontend), Render (Backend)
   [Access the App](https://bejewelled-melomakarona-2b6175.netlify.app/)

---

##  How Explainable AI Works

To promote trust in our model, particularly among healthcare workers and physicians, we employ:

### ✅ Grad-CAM (Gradient-weighted Class Activation Mapping)
Highlights important regions within an image that contributed to the classification (e.g., irregular nuclei, chromatin).

### ✅ Saliability Maps
Illustrate pixel-level sensitivity by computing gradient-based importance for every pixel in an image.

These tools enable *transparent decision-making, **clinical validation, and compliance with **regulatory explainability requirements***.

---

##  Results

- ✅ *97% Accuracy* on ALL-IDB dataset
-  *Cross-validated*
-  *Confusion matrix* checked
-  Visual heatmaps enable *doctors to interpret and validate AI decisions*

---

##  Real-World Inspiration

Top organizations globally are embracing XAI in diagnostics:

- *Tata Memorial (India)* – AI oncology studies
- *Apollo Hospitals* – AI pathology pilots
- *Stanford CheXNet* – Grad-CAM-based pneumonia detection
- *Mayo Clinic, NHS, Aravind Eye Hospital* – AI and XAI in real-time clinical application

---

##  Impact on Rural Healthcare

-  *Decreased diagnosis time* (from 2–4 hours to minutes)
- ‍⚕ *24/7 availability*, in contrast to human pathologists
-  *No requirement for costly labs or trained oncologists*
-  *Accessible through any internet-connected device*

---

##  The Chain of Collaboration

Through the integration of:
- *Doctors* (validation of diagnosis)
- *Pathology labs* (uploading of samples)
- *Patients* (access to reports)

We form a *collaborative, transparent, and quicker diagnostic environment* — much better than the old disconnected method.

---

##  Future Scope

- Multi-cancer detection models
- Hospital information system (HIS) integration
- Rural health workers multilingual support
- Offline edge device deployment for no-internet areas

---


> "Bridging the diagnostic divide — from metro labs to village clinics."
# readme
