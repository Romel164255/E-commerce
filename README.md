-------------------------------------------Full Stack E-Commerce Platform----------------------------
A full-stack e-commerce web application built using the PERN stack (PostgreSQL, Express.js, React, Node.js).
The application allows users to browse products, authenticate securely, manage carts, and place orders.
The project demonstrates REST API development, authentication with JWT, database integration, and full-stack architecture.

--------------------------------------------Live Demo----------------------------------------
Frontend: https://e-commerce-hazel-chi.vercel.app
Repository : https://github.com/Romel164255/E-commerce

-------------------------------------------Features------------------------------
User Features
User registration and login
Secure authentication using JWT
Browse products
Add/remove products from cart
Place orders
Persistent user sessions
Admin Features
Product management (Create, Update, Delete)
Manage orders
Manage product inventory
System Features
RESTful API architecture
Secure authentication middleware
PostgreSQL database integration
Responsive frontend using React

----------------------------------------Tech Stack-------------------------------------
=========Frontend===========
React.js
HTML5
CSS3
JavaScript
=========Backend=============
Node.js
Express.js
REST APIs
Database
PostgreSQL
Authentication
JSON Web Token (JWT)
Tools
Git
GitHub
Vercel (deployment)

----------------------------------------------Project Structure-----------------------------------------------
E-commerce
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── middleware
│   ├── models
│   └── server.js
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── App.js
│
└── README.md
----------------------------------------------Installation-------------------------------------------------------
1 Clone the Repository
git clone https://github.com/Romel164255/E-commerce.git
cd E-commerce
2 Install Dependencies

Backend

cd backend
npm install

Frontend

cd frontend
npm install
3 Environment Variables

Create a .env file inside the backend folder----------------------------------------------------------------------

Example:
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
Run the Application

Start backend server

cd backend
npm start

Start frontend

cd frontend
npm start

Application will run at

http://localhost:3000
API Endpoints
Authentication
Register User
POST /api/auth/register

Request Body

{
"name": "John",
"email": "john@example.com",
"password": "123456"
}
Login User
POST /api/auth/login

Request Body

{
"email": "john@example.com",
"password": "123456"
}
Products
Get All Products
GET /api/products

Returns list of all available products.

Get Single Product
GET /api/products/:id

Returns details of a specific product.

Create Product (Admin)
POST /api/products

Request Body

{
"name": "Laptop",
"price": 1200,
"description": "High performance laptop",
"category": "Electronics",
"stock": 10
}
Update Product
PUT /api/products/:id

Updates product information.

Delete Product
DELETE /api/products/:id

Removes a product from the database.

Cart
Get Cart
GET /api/cart

Returns the logged-in user's cart items.

Add Item to Cart
POST /api/cart

Request Body

{
"productId": "123",
"quantity": 2
}
Remove Item from Cart
DELETE /api/cart/:id

Removes a product from the cart.

Orders
Create Order
POST /api/orders

Creates an order from the cart items.

Get User Orders
GET /api/orders

Returns all orders of the logged-in user.

Get Order by ID
GET /api/orders/:id

Returns details of a specific order.

Authentication

Protected routes require a JWT token in the request header.

Example

Authorization: Bearer <token>
Future Improvements
Payment gateway integration (Stripe/Razorpay)
Product reviews and ratings
Inventory management
Email notifications
Order tracking

------------------------------------------------------------------Author---------------------------------------------------------------
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Romel Augustine Fernandez >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

GitHub
https://github.com/Romel164255

LinkedIn
https://linkedin.com/in/romel-augustine-fernandez-775a643aa
