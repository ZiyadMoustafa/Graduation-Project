# ⚡ HealthMate - Nezamk

## 📌 Overview
**HealthMate - Nezamk** is an online platform that brings together all health services in one place — connecting clients with trusted fitness trainers, nutritionists, and physical therapists.  
The platform provides a smooth booking process, secure online payments, real-time chat, and personalized health guidance, with a fair commission model for service providers.  
It is designed with a strong focus on the Arabic-speaking community, ensuring cultural relevance, professional interaction, and ease of use.

---

## 🎯 Introduction
In today’s fast-paced world, maintaining a healthy lifestyle is more important than ever.  
However, in the Arabic-speaking region, health and wellness services are often fragmented — requiring users to switch between multiple apps for fitness, nutrition, injury recovery, and communication. This leads to a poor user experience, reduced motivation, and inconsistent results.

On the other hand, certified health professionals struggle to find a single platform to showcase their expertise, connect with clients, and manage long-term relationships.

**Nezamk** solves these problems by offering:
- One integrated platform for all health-related services.
- Direct connection between users and verified professionals.
- Tools for personalized, culturally relevant, and trackable health plans.

This project bridges the gap between clients and professionals, making health services more accessible, efficient, and engaging.

---

## 🚀 Features

- **User Registration and Authentication**  
  Clients and service providers can sign up and log in securely via email and password.

- **Profile Management**  
  - Clients: Add personal health details (age, weight, height, goal, activity level).  
  - Service Providers: Add professional details (bio, experience, service price, identifier).

- **Booking System**  
  - Clients send booking requests based on subscription duration.  
  - Providers accept or reject requests.  
  - Chat opens upon acceptance and closes after the subscription ends.

- **Online Payment**  
  - Stripe integration for secure payments.  
  - A percentage goes to the platform is 15%, the rest to the provider.

- **Real-time Chat System**  
  - Private chat available during active subscriptions.  
  - Automatically disabled after the subscription ends with keeping history of chat.

- **AI-based Recommendations**  
  - Personalized workout suggestions based on client data.  
  - Built-in chatbot for guidance and support.

- **Educational Content**  
  - Service providers can publish articles and health tips.

- **Community Engagement**  
  - Clients can post updates, like, and comment within the community space.

- **Rating and Reviews**  
  - Clients can rate and review providers after subscription completion.

- **Google Fit Integration**  
  - Syncs activity data for better health tracking.

- **Security**  
  - JWT authentication, data validation, XSS protection and secure image upload.

---

## 🧰 Tech Stack

| Tool / Technology | Purpose |
|-------------------|---------|
| **Node.js** | Backend runtime environment |
| **Express.js** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **Socket.IO** | Real-time chat |
| **Stripe** | Payment gateway |
| **JWT** | Authentication |
| **Cloudinary** | Image & media storage |
| **Multer** | File uploads |
| **CORS** | Cross-origin requests |
| **Bcrypt** | Password hashing |
| **Helmet** | Securing HTTP headers |
| **Rate Limiting** | Protect against abuse |
| **Vercel,Railway** | Backend hosting |
| **Vercel** | Frontend hosting |
| **Flutter** | Mobile application |
| **Figma** | UI/UX Design |

---

## 📜 System Flow

1. **Client Registration & Login**  
2. **Booking Process** → Select provider → Choose goal & duration → Pay via Stripe → Send request.  
3. **Approval / Rejection** → If approved: chat opens → If rejected: full refund.  
4. **Chat & Support** → Active during subscription → Closed after end date.  
5. **AI Recommendations & Tracking** → Personalized plans + Google Fit integration.  
6. **Post-Subscription** → Ratings, reviews, and progress sharing.

---

## 📂 Folder Structure

```bash
backend/
├── controllers/     # API business logic
├── models/          # Database models (User, Client, Provider, Booking, Message)
├── routes/          # API routes
├── utils/           # Helper functions
├── views/           # html template to send OTP
├── index.js         # Main server entry point
├── app.js           # application configuration
├── package.json     # Project dependencies
└── config.env       # Environment variables like (DB, Cloudinary, Stripe)
```

## 🔒 Security Measures

- Passwords hashed using bcrypt.
- JWT tokens with expiration for authentication.
- Input validation before database operations.
- Helmet for securing HTTP headers.
- Rate limiting for login.
- Input sanitization to prevent XSS attacks.
- Secure image uploads with validation and checks.


## 🔗 API Documentation  
All API endpoints are available in the [Postman Collection](https://documenter.getpostman.com/view/34407391/2sB2cd3xHm).
