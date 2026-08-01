# 📝 Notes REST API

A simple REST API built with **Node.js**, **Express.js**, and **Joi** that performs CRUD (Create, Read, Update, Delete) operations on notes.

This project follows a **layered architecture** using **Routes → Controllers → Services → Middleware**.

---

## 🚀 Features

- Create a new note
- Get all notes
- Get a note by ID
- Update an existing note
- Delete a note
- Request validation using Joi
- Proper HTTP status codes
- Tested using Postman

---

## 🛠️ Technologies Used

- Node.js
- Express.js
- Joi
- Postman

---

## 📂 Project Structure

```
NotesAPI/
│
├── controllers/
│   └── noteController.js
│
├── middleware/
│   └── validateNote.js
│
├── routes/
│   └── noteRoutes.js
│
├── services/
│   └── noteService.js
│
├── server.js
├── package.json
└── README.md
```

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
```

### 2. Navigate to the project

```bash
cd NotesAPI
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
node server.js
```

Server runs on:

```
http://localhost:3000
```

---

## 📌 API Endpoints

### 1. Get All Notes

**GET**

```
/notes
```

Response

```json
[
  {
    "id": 1,
    "title": "Learn Express",
    "content": "Practice CRUD APIs"
  }
]
```

---

### 2. Get Note By ID

**GET**

```
/notes/:id
```

Example

```
GET /notes/1
```

---

### 3. Create Note

**POST**

```
/notes
```

Request Body

```json
{
  "title": "Learn Node.js",
  "content": "Study Express Framework"
}
```

---

### 4. Update Note

**PUT**

```
/notes/:id
```

Request Body

```json
{
  "title": "Updated Title",
  "content": "Updated Content"
}
```

---

### 5. Delete Note

**DELETE**

```
/notes/:id
```

Example

```
DELETE /notes/1
```

---

## ✅ Validation

This project uses **Joi** to validate incoming request bodies.

Rules:

- Title is required.
- Title must be a string.
- Content is required.
- Content must be a string.

Example invalid request:

```json
{
  "title": 123
}
```

Response:

```json
{
  "message": "\"title\" must be a string"
}
```

Status Code:

```
400 Bad Request
```

---

## 📋 HTTP Status Codes

| Status Code | Description |
| ----------- | ----------- |
| 200         | OK          |
| 201         | Created     |
| 400         | Bad Request |
| 404         | Not Found   |

---

## 🧪 Testing

The API was tested using **Postman**.

Tested endpoints:

- GET /notes
- GET /notes/:id
- POST /notes
- PUT /notes/:id
- DELETE /notes/:id

---

## 📌 Notes

- This project currently stores notes in an **in-memory array**.
- Data is lost whenever the server restarts.
- Database integration (MongoDB) can be added in future versions.

---

## 🔮 Future Improvements

- MongoDB integration
- User Authentication (JWT)
- Pagination
- Search Notes
- Unit Testing
- Docker Support

---

## 👨‍💻 Author

**Vinit**

Backend Learning Project – Week 1 Task 4
